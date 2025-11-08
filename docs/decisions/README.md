# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting key technical decisions made during the ShopLite project implementation.

---

## What are ADRs?

Architecture Decision Records (ADRs) capture important architectural decisions along with their context and consequences. Each ADR describes:

- **Context**: The situation and problem being addressed
- **Decision**: The choice that was made
- **Consequences**: The positive and negative outcomes

---

## ADR Index

### [ADR 001: Choreography vs Orchestration](./001-choreography-vs-orchestration.md)
**Status**: Accepted
**Decision**: Use event-driven choreography instead of centralized saga orchestration

**Summary**: Services coordinate autonomously via domain events (OrderPlaced → StockReserved/Rejected) without a central orchestrator. This provides better decoupling and eliminates single points of failure, at the cost of harder debugging and visualization.

**Key Trade-off**: Decoupling vs Observability

---

### [ADR 002: Outbox Pattern Implementation](./002-outbox-pattern-implementation.md)
**Status**: Accepted
**Decision**: Use transactional outbox pattern for reliable event publishing

**Summary**: Events are written to a database outbox table in the same transaction as business data. A background dispatcher polls the outbox and publishes events to Kafka. This solves the dual-write problem and guarantees at-least-once delivery.

**Key Trade-off**: Reliability vs Latency (1-second polling delay)

---

### [ADR 003: Polyglot Persistence Strategy](./003-polyglot-persistence.md)
**Status**: Accepted
**Decision**: Use PostgreSQL for Orders Service and MongoDB for Inventory Service

**Summary**: Orders Service needs ACID transactions (for outbox pattern) and relational modeling (orders + items). Inventory Service benefits from MongoDB's atomic $inc operations for high-throughput stock updates. Each service uses the database best suited to its needs.

**Key Trade-off**: Right Tool for Job vs Operational Complexity

---

### [ADR 004: Node.js vs .NET](./004-nodejs-vs-dotnet.md)
**Status**: Accepted
**Decision**: Implement all services using Node.js with JavaScript

**Summary**: Node.js provides rapid development, natural async/await for event-driven patterns, lightweight runtime, and excellent AI code generation support. Plain JavaScript (not TypeScript) chosen to minimize ceremony and maximize iteration speed within the 72-hour timeline.

**Key Trade-off**: Development Speed vs Type Safety

---

### [ADR 005: Idempotency Strategy](./005-idempotency-strategy.md)
**Status**: Accepted
**Decision**: Use in-memory event ID tracking for idempotent event processing

**Summary**: All events include unique event-id in Kafka headers. Consumers maintain an in-memory Set of processed IDs to detect and skip duplicates. This prevents double-processing (e.g., double stock reservations) when Kafka redelivers messages. Documented as demo-appropriate; production should use database-backed tracking.

**Key Trade-off**: Simplicity vs Restart Resilience

---

## Decision Themes

### 1. Simplicity Over Perfection
- In-memory idempotency (ADR 005)
- Plain JavaScript vs TypeScript (ADR 004)
- Background polling vs CDC (ADR 002)

**Rationale**: 72-hour timeline, demo/interview context, clear documentation of production path

### 2. Event-Driven Architecture
- Choreography pattern (ADR 001)
- Outbox pattern (ADR 002)
- At-least-once delivery + idempotency (ADR 002, 005)

**Rationale**: Meets spec requirements, demonstrates distributed systems expertise

### 3. Polyglot Approach
- PostgreSQL + MongoDB (ADR 003)
- Different patterns per service (outbox vs atomic ops)

**Rationale**: Demonstrates breadth of knowledge, uses right tool for each job

---

## How to Read ADRs

1. **Start with Context**: Understand the problem being solved
2. **Review Alternatives**: See what was considered and rejected
3. **Understand Consequences**: Know the trade-offs accepted
4. **Check "When to Reconsider"**: Know when decision should change

---

## ADR Template

New ADRs should follow this structure:

```markdown
# ADR XXX: Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded
**Context**: Brief description

---

## Decision

Clear statement of the choice made.

---

## Context

Detailed explanation of the problem and constraints.

---

## Consequences

### ✅ Advantages
- ...

### ❌ Disadvantages
- ...

---

## Alternatives Considered

### Alternative 1: ...
**Why rejected**: ...

---

## When to Reconsider

- Condition 1
- Condition 2

---

## References

- Links to relevant documentation

---

## Related Decisions

- [ADR XXX: ...]
```

---

## References

- [ADR Documentation](https://adr.github.io/) - Michael Nygard's ADR template
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original article by Michael Nygard
- [Architecture Decision Records in Practice](https://www.thoughtworks.com/insights/blog/architecture-decision-records-practice)

---

**Last Updated**: 2025-11-08
**Total ADRs**: 5
