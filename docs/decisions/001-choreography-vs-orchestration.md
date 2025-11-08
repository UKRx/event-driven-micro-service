# ADR 001: Choreography vs Orchestration

**Date**: 2025-11-08
**Status**: Accepted
**Context**: Order saga coordination pattern

---

## Decision

Use **event-driven choreography** instead of centralized saga orchestration for the Order → Inventory coordination flow.

---

## Context

When implementing distributed transactions across Orders Service and Inventory Service, we had two main patterns to choose from:

### Option 1: Orchestration (Saga Orchestrator)
```
┌────────────────┐
│ Saga Manager   │
│ (Orchestrator) │
└───┬────────┬───┘
    │        │
    ▼        ▼
┌────────┐ ┌───────────┐
│Orders  │ │Inventory  │
└────────┘ └───────────┘
```

- Central component coordinates all saga steps
- Sends commands to services
- Maintains saga state
- Handles compensation

### Option 2: Choreography (Event-Driven)
```
┌────────┐   OrderPlaced   ┌───────────┐
│Orders  │───────────────→ │Inventory  │
└────────┘                  └───────────┘
    ▲                            │
    │        StockReserved       │
    └────────────────────────────┘
```

- Services react to domain events
- No central coordinator
- Each service publishes events
- Others subscribe and react

---

## Decision Drivers

1. **System Complexity**: Only 2 services in the saga (Orders, Inventory)
2. **Decoupling**: Want services to remain independent
3. **Single Point of Failure**: Avoid SPOF in critical path
4. **Extensibility**: Easy to add new services (Payments, Shipping)
5. **Team Autonomy**: Services can evolve independently

---

## Decision

**Chosen: Choreography (Event-Driven)**

### Flow:
1. Orders Service publishes `OrderPlaced` event
2. Inventory Service consumes event, reserves stock
3. Inventory publishes `StockReserved` or `StockRejected`
4. Orders Service consumes event, updates order status

---

## Consequences

### ✅ Advantages

1. **No Single Point of Failure**: No orchestrator to crash
2. **High Decoupling**: Services don't know about each other
3. **Easy to Extend**: Add new consumers without changing existing services
   - Example: Add Payments Service that listens to `OrderPlaced`
4. **Scalability**: Each service scales independently
5. **Team Autonomy**: Teams own their event contracts

### ❌ Disadvantages

1. **Harder to Visualize**: No single place showing complete flow
   - **Mitigation**: Create sequence diagram (docs/architecture/sequence-diagram.md)
2. **Debugging Complexity**: Need distributed tracing
   - **Mitigation**: Use `traceId` and `correlationId` in all events
3. **No Central Saga State**: Can't query "what step is saga on?"
   - **Mitigation**: Each service maintains its own state (order status)
4. **Cyclic Dependencies Risk**: If not careful with event design
   - **Mitigation**: Use clear event naming (past tense: OrderPlaced, not CreateOrder)

---

## Alternatives Considered

### Alternative 1: Orchestrator Pattern

**Pros**:
- Easy to visualize flow
- Central saga state
- Easier rollback/compensation

**Cons**:
- Single point of failure
- Tight coupling
- Orchestrator becomes god component
- Harder to scale

**Why rejected**: Only 2 services, SPOF risk too high

### Alternative 2: Process Manager (Hybrid)

**Pros**:
- Combines orchestration and choreography
- Better for complex sagas

**Cons**:
- Overkill for 2-service flow
- More infrastructure complexity

**Why rejected**: Too complex for current requirements

---

## When to Reconsider

Reconsider orchestration if:

1. **Saga grows beyond 5 steps**: Choreography becomes hard to reason about
2. **Complex compensation logic**: Need rollback transactions
3. **Regulatory audit requirements**: Need complete saga state history
4. **Temporal dependencies**: Steps must execute in strict order

---

## References

- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Choreography vs Orchestration](https://temporal.io/blog/to-choreograph-or-orchestrate-your-saga-that-is-the-question)
- Chris Richardson's "Microservices Patterns" book, Chapter 4

---

## Related Decisions

- [ADR 002: Outbox Pattern Implementation](./002-outbox-pattern-implementation.md)
- [ADR 005: Idempotency Strategy](./005-idempotency-strategy.md)
