# ADR 002: Outbox Pattern Implementation

**Date**: 2025-11-08
**Status**: Accepted
**Context**: Reliable event publishing from Orders Service

---

## Decision

Implement the **Transactional Outbox Pattern** for publishing domain events from Orders Service to Kafka.

---

## Context

### The Dual-Write Problem

When creating an order, we need to:
1. Persist order to PostgreSQL
2. Publish `OrderPlaced` event to Kafka

**Naive approach**:
```javascript
// ❌ PROBLEM: Two separate writes
await db.insert(order);          // Write 1
await kafka.publish(event);      // Write 2
```

**Failure scenarios**:
- ✅ DB success, ❌ Kafka fails → Order created, no event published → Inventory never reserves stock
- ❌ DB fails, ✅ Kafka success → Event published for non-existent order → Inventory reserves phantom stock

Neither failure is acceptable!

---

## Decision

Use **Outbox Pattern** to guarantee at-least-once event delivery.

### Architecture

```
┌─────────────────────────────────────────┐
│ Orders Service                          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ PostgreSQL Transaction           │  │
│  │                                  │  │
│  │  1. INSERT INTO orders (...)     │  │
│  │  2. INSERT INTO order_items (...) │  │
│  │  3. INSERT INTO outbox (...)  ✅ │  │
│  │                                  │  │
│  │  COMMIT                          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Background Outbox Dispatcher     │  │
│  │                                  │  │
│  │  while (true) {                  │  │
│  │    events = SELECT * FROM outbox │  │
│  │            WHERE processed = NULL│  │
│  │    for (event in events) {       │  │
│  │      kafka.publish(event)        │  │
│  │      UPDATE outbox               │  │
│  │        SET processed_at = NOW()  │  │
│  │    }                             │  │
│  │    sleep(1s)                     │  │
│  │  }                               │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Implementation

### Database Schema

```sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID NOT NULL,        -- Order ID
  type VARCHAR(50) NOT NULL,         -- 'OrderPlaced'
  payload JSONB NOT NULL,            -- Event data
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP             -- NULL until published
);

CREATE INDEX idx_outbox_processed
ON outbox (processed_at)
WHERE processed_at IS NULL;  -- Partial index for performance
```

### Transactional Write

```javascript
async createWithOutbox(order, eventPayload) {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert order
    await client.query(
      'INSERT INTO orders (id, customer_id, status, ...) VALUES (...)'
    );

    // 2. Insert order items
    await client.query(
      'INSERT INTO order_items (order_id, sku, qty) VALUES (...)'
    );

    // 3. Insert outbox event (same transaction!)
    await client.query(
      'INSERT INTO outbox (aggregate_id, type, payload) VALUES ($1, $2, $3)',
      [order.id, 'OrderPlaced', JSON.stringify(eventPayload)]
    );

    await client.query('COMMIT');  // Atomic!
    return order.id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Background Dispatcher

```javascript
class OutboxDispatcher {
  async start() {
    setInterval(async () => {
      await this.processOutboxEvents();
    }, 1000); // Poll every 1 second
  }

  async processOutboxEvents() {
    const result = await client.query(
      'SELECT * FROM outbox WHERE processed_at IS NULL ORDER BY created_at LIMIT 100'
    );

    for (const event of result.rows) {
      try {
        // Publish to Kafka
        await this.producer.send({
          topic: 'orders.placed',
          messages: [{
            key: event.aggregate_id,
            value: event.payload,
            headers: {
              'event-id': event.id,
              'event-type': event.type,
              'correlation-id': event.payload.correlationId
            }
          }]
        });

        // Mark as processed
        await client.query(
          'UPDATE outbox SET processed_at = NOW() WHERE id = $1',
          [event.id]
        );

        logger.info(`Published event ${event.id} to Kafka`);
      } catch (error) {
        logger.error(`Failed to publish event ${event.id}:`, error);
        // Event stays unprocessed, will retry on next poll
      }
    }
  }
}
```

---

## Consequences

### ✅ Advantages

1. **Guaranteed Delivery**: Events never lost (committed with business data)
2. **At-Least-Once Semantics**: Dispatcher retries until Kafka confirms
3. **No Dual-Write Problem**: Single database transaction
4. **Audit Trail**: Outbox table serves as event history
5. **Resilience**: Survives Kafka downtime (events queue in outbox)

### ❌ Disadvantages

1. **Eventual Consistency**: Events published asynchronously (1-second delay)
   - **Mitigation**: Acceptable for business requirements (order saga is async)
2. **Polling Overhead**: Background process constantly queries database
   - **Mitigation**: Partial index on `processed_at IS NULL` keeps queries fast
3. **Duplicate Events Possible**: If dispatcher crashes after Kafka send but before DB update
   - **Mitigation**: Consumers must be idempotent (see ADR 005)
4. **Storage Growth**: Outbox table grows indefinitely
   - **Mitigation**: Add cleanup job to archive old processed events

---

## Alternatives Considered

### Alternative 1: Direct Kafka Publishing

```javascript
// ❌ Dual-write problem
await db.insert(order);
await kafka.publish(event);
```

**Why rejected**: No atomicity guarantee, events can be lost

### Alternative 2: Transaction Log Tailing (Change Data Capture)

Use Debezium to tail PostgreSQL WAL and publish changes to Kafka.

**Pros**:
- No outbox table needed
- Very low latency

**Cons**:
- Complex infrastructure (Kafka Connect, Debezium)
- Couples database schema to event schema
- Harder to transform events

**Why rejected**: Too much infrastructure for 72-hour timeline

### Alternative 3: Two-Phase Commit (2PC)

Use distributed transaction coordinator (XA protocol).

**Pros**:
- Strong consistency
- Synchronous

**Cons**:
- Poor performance (blocking)
- Complex rollback scenarios
- Kafka doesn't support XA transactions

**Why rejected**: Performance and complexity issues

---

## Performance Considerations

### Polling Interval Trade-offs

| Interval | Latency | DB Load | Use Case |
|----------|---------|---------|----------|
| 100ms | Low | High | Real-time systems |
| 1s | Medium | Medium | **Our choice** |
| 5s | High | Low | Batch-oriented |

**Chosen**: 1 second balances latency and DB load.

### Cleanup Strategy

```sql
-- Run daily to archive processed events older than 30 days
DELETE FROM outbox
WHERE processed_at IS NOT NULL
  AND processed_at < NOW() - INTERVAL '30 days';
```

---

## When to Reconsider

Reconsider this pattern if:

1. **Latency Requirements Change**: Need <100ms event delivery
   - Consider: CDC with Debezium
2. **Event Volume Grows**: >10,000 events/second
   - Consider: Batching, multiple dispatcher instances
3. **Strong Consistency Needed**: Business requires synchronous events
   - Consider: Inline Kafka publishing with compensating transactions

---

## References

- [Transactional Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Debezium CDC](https://debezium.io/)
- Martin Fowler's "Event-Driven Architecture" article

---

## Related Decisions

- [ADR 001: Choreography vs Orchestration](./001-choreography-vs-orchestration.md)
- [ADR 005: Idempotency Strategy](./005-idempotency-strategy.md)
