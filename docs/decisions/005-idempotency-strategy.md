# ADR 005: Idempotency Strategy for Event Consumers

**Date**: 2025-11-08
**Status**: Accepted
**Context**: Handling duplicate event delivery from Kafka

---

## Decision

Use **event ID tracking with in-memory Set** for idempotent event processing, acknowledging this is a demo-appropriate simplification of production-grade database-backed idempotency.

---

## Context

Kafka provides **at-least-once delivery** semantics. This means the same event can be delivered multiple times due to:

1. **Consumer crashes** before committing offset
2. **Network partitions** causing retries
3. **Rebalancing** in consumer groups

### The Problem

Without idempotency:

```javascript
// ❌ PROBLEM: No duplicate detection
async function handleOrderPlaced(event) {
  await reserveStock(event.orderId, event.items);  // Executed twice!
}
```

**Failure scenario**:
1. Event received: Reserve 10 units for SKU "ABC"
2. Stock reserved: `available: 90, reserved: 10`
3. Consumer crashes before committing offset
4. Kafka redelivers same event
5. Stock reserved again: `available: 80, reserved: 20` ❌ **WRONG!**

We've double-reserved stock for one order!

---

## Decision

Implement **event ID deduplication** using Kafka message headers.

### Architecture

```
┌─────────────────────────────────────┐
│ Kafka Message                       │
│                                     │
│ Headers:                            │
│   event-id: "uuid-123"       ←──┐  │
│   event-type: "OrderPlaced"      │  │
│   correlation-id: "corr-456"     │  │
│                                  │  │
│ Payload:                         │  │
│   { orderId, items, ... }        │  │
└──────────────────────────────────┘  │
                                      │
                                      │ Unique ID
                                      │
┌─────────────────────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Event Consumer                      │
│                                     │
│ processedEvents = new Set()         │
│                                     │
│ async function handle(event, hdrs) {│
│   const eventId = hdrs['event-id']; │
│                                     │
│   if (processedEvents.has(eventId)){│
│     return; // Skip duplicate ✅     │
│   }                                 │
│                                     │
│   // Process event...               │
│   await reserveStock(...);          │
│                                     │
│   processedEvents.add(eventId);     │
│ }                                   │
└─────────────────────────────────────┘
```

---

## Implementation

### Outbox Dispatcher (Publisher)

Every event gets a unique ID in headers:

```javascript
// orders-service/src/infrastructure/OutboxDispatcher.js
await producer.send({
  topic: 'orders.placed',
  messages: [{
    key: event.aggregate_id,  // Order ID (for partitioning)
    value: event.payload,
    headers: {
      'event-id': event.id,   // ← Unique UUID from outbox table
      'event-type': event.type,
      'correlation-id': event.payload.correlationId
    }
  }]
});
```

### Inventory Service (Consumer)

Tracks processed event IDs:

```javascript
// inventory-service/src/index.js
const processedEventIds = new Set();

await consumer.run({
  eachMessage: async ({ message }) => {
    const eventId = message.headers['event-id'].toString();

    // Idempotency check
    if (processedEventIds.has(eventId)) {
      logger.info(`Skipping duplicate event: ${eventId}`);
      return; // Don't process again ✅
    }

    // Process event
    const event = JSON.parse(message.value.toString());
    await handleOrderPlaced(event);

    // Mark as processed
    processedEventIds.add(eventId);
    logger.info(`Processed event: ${eventId}`);
  }
});
```

### Orders Service (Consumer)

Same pattern for stock events:

```javascript
// orders-service/src/infrastructure/StockEventConsumer.js
class StockEventConsumer {
  constructor() {
    this.processedEventIds = new Set();
  }

  async handleStockEvent(message) {
    const eventId = message.headers['event-id'].toString();

    if (this.processedEventIds.has(eventId)) {
      return; // Already processed
    }

    const event = JSON.parse(message.value.toString());

    if (event.type === 'StockReserved') {
      await this.processStockReservedUseCase.execute(event);
    } else if (event.type === 'StockRejected') {
      await this.processStockRejectedUseCase.execute(event);
    }

    this.processedEventIds.add(eventId);
  }
}
```

---

## Consequences

### ✅ Advantages

1. **Prevents Duplicate Processing**: Same event processed only once
2. **Simple Implementation**: No database queries needed
3. **Fast Lookups**: Set.has() is O(1)
4. **Low Overhead**: Minimal memory usage (<1KB for 10,000 IDs)
5. **Safe for Retries**: Kafka can retry infinitely without harm

### ❌ Disadvantages

1. **Lost on Restart**: In-memory Set cleared when service restarts
   - **Impact**: After restart, duplicate events (from before restart) will be reprocessed
   - **Mitigation**: Acceptable for demo/interview; production needs database
2. **Memory Growth**: Set grows indefinitely
   - **Mitigation**: Could add LRU eviction (not implemented for simplicity)
3. **No Cross-Instance Deduplication**: Each service instance has own Set
   - **Mitigation**: Use database for production

---

## Alternatives Considered

### Alternative 1: Database-Backed Idempotency

Store processed event IDs in PostgreSQL/MongoDB.

**Implementation**:
```sql
CREATE TABLE processed_events (
  event_id UUID PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Before processing
INSERT INTO processed_events (event_id, event_type)
VALUES ('event-123', 'OrderPlaced')
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;

-- If INSERT returns 0 rows, event already processed
```

**Pros**:
- ✅ Survives restarts
- ✅ Works across multiple instances
- ✅ Audit trail of processed events

**Cons**:
- ❌ Database query on every event (latency)
- ❌ More complex implementation
- ❌ Need to manage table growth (cleanup job)

**Why rejected**: Too complex for 72-hour timeline and demo scope. Documented as "production enhancement" in README.

### Alternative 2: Redis Set

Use Redis for distributed idempotency tracking.

**Pros**:
- ✅ Fast lookups (in-memory)
- ✅ Survives restarts
- ✅ Shared across instances

**Cons**:
- ❌ Additional infrastructure (Redis)
- ❌ More complex setup
- ❌ Single point of failure (without cluster)

**Why rejected**: Unnecessary infrastructure for demo.

### Alternative 3: Kafka Exactly-Once Semantics

Use Kafka's exactly-once processing (requires transactions).

**Pros**:
- ✅ Guaranteed no duplicates
- ✅ Built into Kafka

**Cons**:
- ❌ Complex configuration
- ❌ Performance overhead
- ❌ Requires transactional consumers/producers
- ❌ Not widely supported in KafkaJS

**Why rejected**: Complexity vs benefit trade-off.

---

## Production Migration Path

For production, migrate to database-backed idempotency:

### PostgreSQL Implementation

```javascript
class DatabaseIdempotencyChecker {
  constructor(pool) {
    this.pool = pool;
  }

  async isProcessed(eventId, eventType) {
    const result = await this.pool.query(
      `INSERT INTO processed_events (event_id, event_type)
       VALUES ($1, $2)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [eventId, eventType]
    );
    return result.rowCount === 0; // True if already processed
  }
}

// Usage
const checker = new DatabaseIdempotencyChecker(pool);

await consumer.run({
  eachMessage: async ({ message }) => {
    const eventId = message.headers['event-id'].toString();
    const eventType = message.headers['event-type'].toString();

    if (await checker.isProcessed(eventId, eventType)) {
      return; // Skip duplicate
    }

    // Process event...
  }
});
```

### Cleanup Strategy

```sql
-- Run daily to clean old events
DELETE FROM processed_events
WHERE processed_at < NOW() - INTERVAL '7 days';
```

---

## Testing Idempotency

### Manual Test

```bash
# 1. Create order
ORDER_ID=$(curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"sku":"ABC","qty":2}]}' | jq -r '.orderId')

# 2. Manually publish duplicate OrderPlaced event to Kafka
docker exec -it shoplite-kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic orders.placed \
  --property "parse.key=true" \
  --property "key.separator=:"

# Paste this twice (same event-id):
550e8400-e29b-41d4-a716-446655440000:{"type":"OrderPlaced","orderId":"550e8400-...","items":[{"sku":"ABC","qty":2}],"correlationId":"test-123"}

# 3. Check logs - second event should be skipped
docker logs inventory-service | grep "Skipping duplicate event"
```

---

## When to Reconsider

Reconsider in-memory approach if:

1. **Production Deployment**: Need restart resilience
   - Use: PostgreSQL processed_events table
2. **Multiple Instances**: Horizontal scaling (2+ replicas)
   - Use: Redis or database
3. **Compliance/Audit**: Need proof of idempotency
   - Use: Database with processed_at timestamp
4. **High Event Volume**: Memory constraints
   - Use: LRU cache or database

---

## Event ID Generation

All event IDs come from PostgreSQL's `gen_random_uuid()`:

```sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Unique ID
  aggregate_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

**Properties**:
- ✅ Globally unique (UUID v4)
- ✅ Collision probability: ~1 in 10^36
- ✅ No coordination needed

---

## References

- [Idempotent Receiver Pattern](https://microservices.io/patterns/communication-style/idempotent-consumer.html)
- [Kafka At-Least-Once Delivery](https://kafka.apache.org/documentation/#semantics)
- [UUID v4 Specification](https://tools.ietf.org/html/rfc4122)

---

## Related Decisions

- [ADR 002: Outbox Pattern Implementation](./002-outbox-pattern-implementation.md) (generates event IDs)
- [ADR 001: Choreography vs Orchestration](./001-choreography-vs-orchestration.md)
