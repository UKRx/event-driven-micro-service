# Event Contracts

This directory contains versioned event contracts for the ShopLite system.

## Event Types

### OrderPlaced (v1)
Published by: Orders Service
Consumed by: Inventory Service

Triggered when a customer creates a new order.

### StockReserved (v1)
Published by: Inventory Service
Consumed by: Orders Service

Triggered when inventory successfully reserves stock for an order.

### StockRejected (v1)
Published by: Inventory Service
Consumed by: Orders Service

Triggered when inventory cannot reserve stock (insufficient quantity or product not found).

## Schema Versioning

All events include a `version` field for backward compatibility.

## Event Metadata

All events must include:
- `traceId` - For distributed tracing
- `correlationId` - For business process correlation
- `ts` - ISO-8601 timestamp
