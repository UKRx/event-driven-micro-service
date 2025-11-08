# ADR 003: Polyglot Persistence Strategy

**Date**: 2025-11-08
**Status**: Accepted
**Context**: Database technology choices per service

---

## Decision

Use **PostgreSQL for Orders Service** and **MongoDB for Inventory Service** (polyglot persistence).

---

## Context

Each microservice needs a database. We had three approaches:

### Option 1: Single Shared Database
```
┌─────────┐   ┌───────────┐
│Orders   │   │Inventory  │
└────┬────┘   └─────┬─────┘
     │              │
     └──────┬───────┘
            ▼
      ┌──────────┐
      │PostgreSQL│
      └──────────┘
```

### Option 2: Same DB Technology Per Service
```
┌─────────┐         ┌───────────┐
│Orders   │         │Inventory  │
└────┬────┘         └─────┬─────┘
     ▼                    ▼
┌──────────┐        ┌──────────┐
│PostgreSQL│        │PostgreSQL│
└──────────┘        └──────────┘
```

### Option 3: Different DB Technologies (Polyglot)
```
┌─────────┐         ┌───────────┐
│Orders   │         │Inventory  │
└────┬────┘         └─────┬─────┘
     ▼                    ▼
┌──────────┐        ┌─────────┐
│PostgreSQL│        │MongoDB  │
└──────────┘        └─────────┘
```

---

## Decision

**Chosen: Option 3 - Polyglot Persistence**

- **Orders Service**: PostgreSQL 15
- **Inventory Service**: MongoDB 6

---

## Rationale

### Why PostgreSQL for Orders?

**Data Characteristics**:
- **Relational structure**: Orders have items (1-to-many relationship)
- **ACID requirements**: Need strong transactional guarantees
- **Complex queries**: Join orders with items, filter by customer/status
- **Audit trail**: Version field for optimistic locking
- **Reporting**: Aggregate queries (sales reports, revenue)

**Schema**:
```sql
-- Normalized relational model
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),  -- Foreign key
  line_no INTEGER NOT NULL,
  sku VARCHAR(50) NOT NULL,
  qty INTEGER NOT NULL
);
```

**Key Features Used**:
- ✅ Transactions (outbox pattern)
- ✅ Foreign keys (referential integrity)
- ✅ Indexes (customer_id, status)
- ✅ Optimistic locking (version field)
- ✅ JSONB for outbox payload

### Why MongoDB for Inventory?

**Data Characteristics**:
- **Simple document model**: Each product is independent
- **Atomic operations**: Stock updates need atomicity, not multi-document transactions
- **Read-heavy**: Stock lookups far outnumber updates
- **Flexible schema**: Easy to add product attributes later
- **High write throughput**: Many concurrent stock reservations

**Schema**:
```javascript
// Document model
{
  _id: "ABC",              // SKU as primary key
  name: "Product ABC",
  available: 100,          // Simple counter
  reserved: 0,             // Simple counter
  updatedAt: ISODate("2025-11-08T18:00:00Z")
}
```

**Key Features Used**:
- ✅ Atomic $inc operations (prevent race conditions)
- ✅ Conditional updates (available >= qty)
- ✅ Fast lookups by _id (SKU)
- ✅ No joins needed

**Critical MongoDB Operation**:
```javascript
// Atomic stock reservation (no race conditions)
db.products.updateOne(
  { _id: "ABC", available: { $gte: 2 } },  // Check condition
  {
    $inc: { available: -2, reserved: +2 }, // Update atomically
    $set: { updatedAt: new Date() }
  }
);
```

This single operation:
1. Checks if enough stock
2. Decrements available
3. Increments reserved
4. Updates timestamp

All **atomically** in one network round-trip!

---

## Consequences

### ✅ Advantages

1. **Right Tool for the Job**: Each service uses DB matching its needs
2. **Performance**: MongoDB's atomic ops ideal for high-throughput stock updates
3. **Data Integrity**: PostgreSQL transactions protect order consistency
4. **Scalability**: Services can scale databases independently
5. **Learning**: Demonstrates polyglot persistence (interview plus)

### ❌ Disadvantages

1. **Operational Complexity**: Need to run and monitor two DB technologies
   - **Mitigation**: Docker Compose manages both
2. **Team Skills**: Developers need expertise in both SQL and NoSQL
   - **Mitigation**: Well-documented in README.md
3. **Backup Strategy**: Different backup tools (pg_dump vs mongodump)
   - **Mitigation**: Acceptable for demo/interview project
4. **Cross-Service Queries**: Can't join orders with inventory
   - **Mitigation**: Not needed (services are autonomous)

---

## Alternatives Considered

### Alternative 1: PostgreSQL for Both

**Pros**:
- Simpler operations (one DB technology)
- Can use JOINs if needed
- Strong ACID everywhere

**Cons**:
- MongoDB's atomic $inc is cleaner for stock updates
- Less impressive in interview (not polyglot)
- PostgreSQL row locking for stock would be more complex

**Why rejected**: Inventory doesn't need relational features

### Alternative 2: MongoDB for Both

**Pros**:
- Simpler operations
- Flexible schema

**Cons**:
- MongoDB transactions are complex for outbox pattern
- No referential integrity for order → items relationship
- Optimistic locking harder to implement

**Why rejected**: Orders need strong ACID guarantees

### Alternative 3: Redis for Inventory

**Pros**:
- Extremely fast
- Atomic INCR/DECR commands

**Cons**:
- In-memory (persistence concerns)
- No query capabilities
- Need separate DB for product details

**Why rejected**: MongoDB provides better balance

---

## Technology Comparison

| Feature | PostgreSQL (Orders) | MongoDB (Inventory) |
|---------|-------------------|---------------------|
| Data Model | Relational (normalized) | Document (denormalized) |
| ACID Transactions | ✅ Multi-table | ⚠️ Single-document atomic |
| Schema | Fixed schema | Flexible schema |
| Queries | SQL with JOINs | MQL (no JOINs) |
| Indexing | B-tree, hash, GiST | B-tree, hash, geospatial |
| Concurrency | Row-level locking | Document-level locking |
| Best For | Complex relationships | Simple documents |
| Our Use Case | Orders + Items + Outbox | Product stock levels |

---

## Performance Considerations

### Orders Service (PostgreSQL)

**Indexes**:
```sql
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_outbox_processed ON outbox(processed_at)
  WHERE processed_at IS NULL;  -- Partial index
```

**Expected Queries**:
- `SELECT * FROM orders WHERE customer_id = ?` → Fast (indexed)
- `SELECT * FROM orders WHERE status = 'PENDING'` → Fast (indexed)
- `SELECT * FROM outbox WHERE processed_at IS NULL` → Fast (partial index)

### Inventory Service (MongoDB)

**Indexes**:
```javascript
db.products.createIndex({ _id: 1 });  // Primary key (automatic)
db.products.createIndex({ available: 1 });  // For stock queries
```

**Expected Queries**:
- `db.products.findOne({ _id: "ABC" })` → Instant (primary key)
- `db.products.updateOne({ _id: "ABC", available: { $gte: 2 } }, ...)` → Instant (primary key + conditional)

---

## When to Reconsider

Reconsider if:

1. **Operational Cost Too High**: Managing two DBs becomes burden
   - Consider: Standardize on PostgreSQL (can store JSON for inventory)
2. **Need Cross-Service Queries**: Business requires JOIN-like queries
   - Consider: Data warehouse with replicated data
3. **Team Expertise Limited**: Team only knows SQL
   - Consider: Use PostgreSQL for both
4. **Cloud-Native**: Moving to managed services
   - Consider: Use cloud provider's recommendations (e.g., AWS Aurora + DynamoDB)

---

## References

- [Polyglot Persistence](https://martinfowler.com/bliki/PolyglotPersistence.html) - Martin Fowler
- [MongoDB Atomic Operations](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
- [PostgreSQL ACID Properties](https://www.postgresql.org/docs/current/transaction-iso.html)

---

## Related Decisions

- [ADR 002: Outbox Pattern Implementation](./002-outbox-pattern-implementation.md) (needs PostgreSQL transactions)
- [ADR 004: Node.js vs .NET](./004-nodejs-vs-dotnet.md)
