# ShopLite Order Saga - Sequence Diagram

This document describes the event-driven choreography flow for the ShopLite order processing system.

---

## Participants

- **Customer**: End user placing orders
- **API Gateway**: Entry point with JWT validation
- **Orders Service**: Manages order lifecycle (PostgreSQL)
- **Inventory Service**: Manages product stock (MongoDB)
- **Kafka**: Message broker for asynchronous events
- **Outbox Dispatcher**: Background process publishing events from outbox table

---

## Happy Path: Order Confirmed (Stock Available)

### Step 1: Customer Creates Order

```
Customer → API Gateway: POST /orders
{
  "items": [
    {"sku": "ABC", "qty": 2}
  ]
}
```

### Step 2: Gateway Validates JWT

```
API Gateway validates:
- Token signature (using JWKS from Keycloak)
- Issuer (iss claim)
- Audience (aud claim)
- Expiration (exp claim)
- Scopes (orders.write)
```

### Step 3: Orders Service Creates Order

```
Orders Service → PostgreSQL: BEGIN TRANSACTION

1. INSERT INTO orders (id, customer_id, status, created_at, updated_at, version)
   VALUES (uuid, 'customer123', 'PENDING', NOW(), NOW(), 0)

2. INSERT INTO order_items (order_id, line_no, sku, qty)
   VALUES (uuid, 1, 'ABC', 2)

3. INSERT INTO outbox (aggregate_id, type, payload, created_at)
   VALUES (uuid, 'OrderPlaced', {...}, NOW())

PostgreSQL: COMMIT ✅
```

### Step 4: Response to Customer

```
Orders Service → API Gateway → Customer:
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING"
}

HTTP 201 Created
```

### Step 5: Background - Outbox Dispatcher Publishes Event

```
Outbox Dispatcher (polling every 1 second):

1. SELECT * FROM outbox WHERE processed_at IS NULL LIMIT 100

2. For each event:
   - Publish to Kafka topic: "orders.placed"
   - Event payload:
     {
       "type": "OrderPlaced",
       "version": 1,
       "orderId": "550e8400-...",
       "customerId": "customer123",
       "items": [{"sku": "ABC", "qty": 2}],
       "traceId": "trace-123",
       "correlationId": "corr-456",
       "ts": "2025-11-08T18:00:00Z"
     }
   - Headers:
     - event-id: unique-event-id
     - event-type: OrderPlaced
     - trace-id: trace-123
     - correlation-id: corr-456

3. UPDATE outbox SET processed_at = NOW() WHERE id = event_id
```

### Step 6: Inventory Service Consumes OrderPlaced

```
Inventory Service Kafka Consumer:

1. Receive OrderPlaced event from topic "orders.placed"

2. Check idempotency:
   - If event-id already processed → SKIP (return early)
   - Else → Continue

3. Check stock availability:
   MongoDB: db.products.findOne({_id: "ABC"})
   Result: {available: 10, reserved: 0}

4. Validation:
   available >= qty? (10 >= 2) → TRUE ✅

5. Reserve stock (atomic operation):
   MongoDB: db.products.updateOne(
     {_id: "ABC", available: {$gte: 2}},
     {
       $inc: {available: -2, reserved: +2},
       $set: {updatedAt: NOW()}
     }
   )
   Result: {available: 8, reserved: 2}
```

### Step 7: Inventory Publishes StockReserved

```
Inventory Service → Kafka topic "inventory.stock-reserved":

{
  "type": "StockReserved",
  "version": 1,
  "orderId": "550e8400-...",
  "reservations": [
    {"sku": "ABC", "qty": 2}
  ],
  "traceId": "trace-123",
  "correlationId": "corr-456",
  "ts": "2025-11-08T18:00:03Z"
}
```

### Step 8: Orders Service Confirms Order

```
Orders Service Kafka Consumer:

1. Receive StockReserved event from topic "inventory.stock-reserved"

2. Check idempotency:
   - If event-id already processed → SKIP
   - Else → Continue

3. Update order status:
   PostgreSQL: UPDATE orders
               SET status = 'CONFIRMED',
                   updated_at = NOW(),
                   version = version + 1
               WHERE id = '550e8400-...'
               AND version = 0  -- Optimistic locking

4. Log: "Order confirmed successfully"
```

### Step 9: Customer Checks Order Status

```
Customer → API Gateway: GET /orders/550e8400-...

Orders Service → Customer:
{
  "id": "550e8400-...",
  "customerId": "customer123",
  "status": "CONFIRMED", ← Updated!
  "items": [{"sku": "ABC", "qty": 2}],
  "createdAt": "2025-11-08T18:00:00Z",
  "updatedAt": "2025-11-08T18:00:05Z"
}
```

**✅ Happy Path Complete: Order CONFIRMED**

---

## Unhappy Path: Order Cancelled (Insufficient Stock)

### Steps 1-4: Same as Happy Path

Customer creates order, gets `PENDING` status.

### Step 5-6: Inventory Detects Insufficient Stock

```
Inventory Service receives OrderPlaced:

1. MongoDB: db.products.findOne({_id: "XYZ"})
   Result: {available: 5, reserved: 0}

2. Validation:
   available >= qty? (5 >= 100) → FALSE ❌

3. Stock reservation REJECTED
```

### Step 7: Inventory Publishes StockRejected

```
Inventory Service → Kafka topic "inventory.stock-rejected":

{
  "type": "StockRejected",
  "version": 1,
  "orderId": "660e8400-...",
  "reason": "INSUFFICIENT_STOCK",
  "details": [
    {
      "sku": "XYZ",
      "requested": 100,
      "available": 5
    }
  ],
  "traceId": "trace-124",
  "correlationId": "corr-457",
  "ts": "2025-11-08T18:00:03Z"
}
```

### Step 8: Orders Service Cancels Order

```
Orders Service Kafka Consumer:

1. Receive StockRejected event

2. Update order status:
   PostgreSQL: UPDATE orders
               SET status = 'CANCELLED',
                   updated_at = NOW(),
                   version = version + 1
               WHERE id = '660e8400-...'

3. Log: "Order cancelled due to insufficient stock"
```

### Step 9: Customer Checks Order Status

```
Customer → API Gateway: GET /orders/660e8400-...

Orders Service → Customer:
{
  "id": "660e8400-...",
  "status": "CANCELLED", ← Cancelled!
  "items": [{"sku": "XYZ", "qty": 100}],
  "createdAt": "2025-11-08T18:00:00Z",
  "updatedAt": "2025-11-08T18:00:05Z"
}
```

**❌ Unhappy Path Complete: Order CANCELLED**

---

## Reliability & Idempotency Mechanisms

### 1. Outbox Pattern

**Problem**: How to guarantee event publishing when order is created?

**Solution**:
```sql
BEGIN TRANSACTION
  INSERT INTO orders (...)
  INSERT INTO outbox (...)  -- Same transaction!
COMMIT
```

**Benefits**:
- ✅ Events never lost (committed with business data)
- ✅ At-least-once delivery guaranteed
- ✅ Background dispatcher can retry failures

### 2. Idempotent Event Processing

**Problem**: What if Kafka delivers same event twice?

**Solution**:
```javascript
const processedEvents = new Set(); // In-memory tracking

async function handleEvent(event, headers) {
  const eventId = headers['event-id'];

  if (processedEvents.has(eventId)) {
    console.log('Duplicate event ignored');
    return; // Skip processing ✅
  }

  // Process event...

  processedEvents.add(eventId);
}
```

**Benefits**:
- ✅ Duplicate events don't cause double-processing
- ✅ Safe to retry failed events
- ✅ Prevents double stock reservation

### 3. Optimistic Locking (Orders)

**Problem**: Concurrent updates to same order?

**Solution**:
```sql
UPDATE orders
SET status = 'CONFIRMED',
    version = version + 1
WHERE id = '550e8400-...'
AND version = 0  -- Must match current version!
```

**Benefits**:
- ✅ Prevents lost updates
- ✅ Detects concurrent modifications
- ✅ Fails fast on conflicts

### 4. Atomic Stock Updates (MongoDB)

**Problem**: Race conditions in stock updates?

**Solution**:
```javascript
db.products.updateOne(
  {_id: "ABC", available: {$gte: qty}}, // Check and update atomically
  {$inc: {available: -qty, reserved: +qty}}
)
```

**Benefits**:
- ✅ No race conditions
- ✅ Prevents overselling
- ✅ Single database operation

---

## Event Flow Summary

```
┌─────────┐
│Customer │
└────┬────┘
     │ POST /orders
     ▼
┌─────────────┐
│API Gateway  │ ← JWT Validation
└─────┬───────┘
      │
      ▼
┌──────────────┐      ┌──────────┐
│Orders Service│◄─────┤PostgreSQL│
└──────┬───────┘      └──────────┘
       │ 1. Create order
       │ 2. Write to outbox (transactional)
       │
       ▼
┌──────────────┐
│Outbox        │ ← Background process
│Dispatcher    │
└──────┬───────┘
       │ Publish OrderPlaced
       ▼
    ┌──────┐
    │Kafka │
    └───┬──┘
        │ OrderPlaced event
        ▼
┌──────────────────┐      ┌───────┐
│Inventory Service │◄─────┤MongoDB│
└──────┬───────────┘      └───────┘
       │ 1. Check stock
       │ 2. Reserve atomically
       │ 3. Publish StockReserved/Rejected
       │
       ▼
    ┌──────┐
    │Kafka │
    └───┬──┘
        │ StockReserved/Rejected
        ▼
┌──────────────┐
│Orders Service│ ← Updates order status
└──────────────┘   (CONFIRMED/CANCELLED)
```

---

## Key Design Decisions

### ✅ Choreography (Not Orchestration)

**Why?**
- Services remain decoupled
- No single point of failure
- Easy to add new services

**Trade-off**: Harder to visualize complete flow

### ✅ Outbox Pattern

**Why?**
- Guarantees at-least-once delivery
- Solves dual-write problem

**Trade-off**: Additional complexity (background dispatcher)

### ✅ Event Versioning

**Why?**
- Backward compatibility
- Schema evolution

**Example**: `"version": 1` in all events

### ✅ Correlation IDs

**Why?**
- Distributed tracing
- Debug end-to-end flows
- Monitor business processes

**Fields**: `traceId`, `correlationId` in all events

---

## Timing Analysis

| Step | Component | Duration | Cumulative |
|------|-----------|----------|------------|
| 1 | Customer → Gateway | ~10ms | 10ms |
| 2 | JWT Validation | ~20ms | 30ms |
| 3 | Create Order (DB) | ~50ms | 80ms |
| 4 | Response to Customer | ~10ms | **90ms** ← Customer gets response |
| 5 | Outbox poll & publish | ~500ms | 590ms |
| 6 | Kafka delivery | ~100ms | 690ms |
| 7 | Inventory processing | ~50ms | 740ms |
| 8 | Kafka delivery | ~100ms | 840ms |
| 9 | Order status update | ~50ms | **890ms** ← Order confirmed |

**Total end-to-end latency**: ~900ms (asynchronous)

**Customer perceived latency**: ~90ms (synchronous)

---

## Error Scenarios

### 1. Kafka Down During Outbox Publishing

**What happens?**
- Outbox dispatcher can't publish events
- Events remain in outbox with `processed_at = NULL`
- Dispatcher keeps retrying

**Recovery**:
- When Kafka comes back up, dispatcher catches up
- All pending events published in order

**Impact**: ✅ No data loss, delayed processing

### 2. Inventory Service Crashes

**What happens?**
- OrderPlaced event stays in Kafka (retained)
- Kafka consumer group tracks offset

**Recovery**:
- When service restarts, resumes from last committed offset
- Processes pending events

**Impact**: ✅ No data loss, delayed processing

### 3. Duplicate Event Delivery

**What happens?**
- Kafka delivers same event twice (at-least-once)
- Consumer checks `event-id` in tracking set
- Second delivery is ignored

**Impact**: ✅ No double-processing

---

## Production Enhancements

### 1. Dead Letter Queue (DLQ)

```javascript
async function handleEvent(event) {
  let retries = 0;
  while (retries < 3) {
    try {
      await processEvent(event);
      return; // Success
    } catch (error) {
      retries++;
      await sleep(Math.pow(2, retries) * 1000); // Exponential backoff
    }
  }
  // After 3 retries, send to DLQ
  await publishToDLQ(event, error);
}
```

### 2. Database-Backed Idempotency

```sql
CREATE TABLE processed_events (
  event_id VARCHAR(36) PRIMARY KEY,
  processed_at TIMESTAMP NOT NULL,
  event_type VARCHAR(50) NOT NULL
);

-- Before processing
INSERT INTO processed_events (event_id, processed_at, event_type)
VALUES ('event-123', NOW(), 'OrderPlaced')
ON CONFLICT DO NOTHING;
```

### 3. Event Replay

```javascript
// Replay events for debugging or recovery
async function replayEvents(fromDate, toDate) {
  const events = await db.query(
    'SELECT * FROM outbox WHERE created_at BETWEEN $1 AND $2',
    [fromDate, toDate]
  );

  for (const event of events) {
    await kafka.publish(event);
  }
}
```

---

## Related Documentation

- [Event Contracts](../../contracts/README.md)
- [Architecture Decision Records](../decisions/)
- [PlantUML Source](./sequence-diagram.puml)
- [Main README](../../README.md)

---

**Last Updated**: 2025-11-08
**Status**: Production-ready design
