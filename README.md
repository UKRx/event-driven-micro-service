# ShopLite - Event-Driven Microservices

⚠️ **AI Usage Declaration**: This project was developed with ~75% AI-generated code using Claude Code. See PROMPTS.md for detailed log.

## Overview

ShopLite is a minimal Order & Inventory management system demonstrating:
- Event-driven choreography pattern
- Clean Architecture across microservices
- OAuth2/OIDC security with Keycloak
- Polyglot persistence (PostgreSQL + MongoDB)
- Reliable async messaging with Kafka

## Architecture

### Services

1. **Orders Service** (Node.js + PostgreSQL)
   - Creates orders
   - Publishes OrderPlaced events via outbox pattern
   - Consumes StockReserved/StockRejected events
   - Updates order status (PENDING → CONFIRMED/CANCELLED)

2. **Inventory Service** (Node.js + MongoDB)
   - Manages product stock
   - Consumes OrderPlaced events
   - Reserves stock atomically
   - Publishes StockReserved/StockRejected events

3. **API Gateway** (Node.js + Express)
   - JWT validation via Keycloak
   - Request routing
   - Scope/role enforcement

### Technology Stack

- **Runtime**: Node.js 18+
- **Databases**: PostgreSQL 15, MongoDB 6
- **Message Broker**: Apache Kafka 3.x
- **Auth Provider**: Keycloak 23.x
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

### Setup

```bash
# Clone repository
git clone <repo-url>
cd event-driven-micro-service

# Start infrastructure (PostgreSQL, MongoDB, Kafka, Keycloak)
cd ops
docker-compose up -d

# Wait for services to be healthy (2-3 minutes)
docker-compose ps

# Install dependencies for each service
cd ../orders-service
npm install

cd ../inventory-service
npm install

cd ../gateway
npm install

# Start services (in separate terminals)
cd orders-service
npm start

cd inventory-service
npm start

cd gateway
npm start
```

### Testing

#### Get Tokens

```bash
# Admin token
curl -X POST http://localhost:8180/realms/shoplite/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=shoplite-api" \
  -d "client_secret=shoplite-secret"

# Customer token
curl -X POST http://localhost:8180/realms/shoplite/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=customer" \
  -d "password=customer" \
  -d "grant_type=password" \
  -d "client_id=shoplite-api" \
  -d "client_secret=shoplite-secret"
```

#### Seed Inventory

```bash
# Add product stock (requires admin token)
curl -X POST http://localhost:8080/inventory/adjust \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"sku":"ABC","delta":100}'
```

#### Happy Path Test

```bash
# Create order (requires customer token)
curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sku": "ABC", "qty": 2}
    ]
  }'

# Response: {"orderId":"uuid","status":"PENDING"}

# Check order status (should become CONFIRMED after a few seconds)
curl http://localhost:8080/orders/<ORDER_ID> \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>"
```

#### Unhappy Path Test

```bash
# Create order with insufficient stock
curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sku": "ABC", "qty": 200}
    ]
  }'

# Order status should become CANCELLED
```

## API Endpoints

### Gateway (Port 8080)

#### Orders
- `POST /orders` - Create order (customer role, orders.write scope)
- `GET /orders/{id}` - Get order (customer sees own, admin sees any)

#### Inventory
- `POST /inventory/adjust` - Adjust stock (admin role, inventory.write scope)
- `GET /inventory/{sku}` - Get product (admin role)

### Health Checks
- Gateway: `http://localhost:8080/_health`
- Orders Service: `http://localhost:5001/_health`
- Inventory Service: `http://localhost:5002/_health`

## Clean Architecture

### Orders Service Structure

```
orders-service/
├── src/
│   ├── domain/           # Business entities (Order)
│   ├── application/      # Use cases (CreateOrder, ConfirmOrder, CancelOrder)
│   ├── infrastructure/   # DB, Kafka, OIDC implementations
│   └── presentation/     # Express controllers, routes
└── tests/
```

**Dependency Rule**: Domain ← Application ← Infrastructure/Presentation

### Event Flow (Choreography)

**Happy Path**:
1. Customer → Gateway: POST /orders
2. Gateway → Orders Service (JWT validated)
3. Orders Service: Save order (PENDING) + outbox entry
4. Outbox Dispatcher → Kafka: OrderPlaced
5. Inventory Service ← Kafka: OrderPlaced
6. Inventory Service: Reserve stock (atomic)
7. Inventory Service → Kafka: StockReserved
8. Orders Service ← Kafka: StockReserved
9. Orders Service: Update order (CONFIRMED)

**Unhappy Path**:
- Step 6: Insufficient stock detected
- Inventory Service → Kafka: StockRejected
- Orders Service: Update order (CANCELLED)

## Database Schemas

### PostgreSQL (Orders)

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version INT NOT NULL DEFAULT 0
);

CREATE TABLE order_items (
    order_id UUID REFERENCES orders(id),
    line_no INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    qty INT NOT NULL,
    PRIMARY KEY (order_id, line_no)
);

CREATE TABLE outbox (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP NULL
);
```

### MongoDB (Inventory)

```javascript
{
  "_id": "ABC",
  "sku": "ABC",
  "available": 10,
  "reserved": 0,
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

## Security

### JWT Validation

- OIDC discovery from Keycloak
- Validates: signature, issuer, audience, expiration
- Caches JWKS (1-hour TTL)

### Roles & Scopes

- **customer**: orders.read, orders.write
- **admin**: all scopes including inventory.write

## Observability

### Structured Logging

All logs include:
- `timestamp` (ISO-8601)
- `level` (info, warn, error)
- `traceId` (distributed tracing)
- `correlationId` (business correlation)
- `service` (service name)

### Metrics

- Request count by endpoint
- Error rate
- Reservation success rate
- Outbox queue depth

## Known Limitations

1. **No Event Replay**: Events are consumed once, no history replay
2. **Single Instance**: No horizontal scaling configured
3. **Basic Monitoring**: Structured logs only, no Prometheus/Grafana
4. **Simplified Auth**: No refresh token flow
5. **No Compensation**: Order cancellation doesn't auto-release reserved stock

## Next Steps

- [ ] Implement event sourcing
- [ ] Add CQRS read models
- [ ] Kubernetes deployment
- [ ] OpenTelemetry integration
- [ ] Circuit breakers (Polly/resilience4j)
- [ ] API rate limiting

## AI Usage Breakdown

| Component | AI-Generated % |
|-----------|----------------|
| Project Structure | 100% |
| Docker/Keycloak Config | 95% |
| Event Contracts | 100% |
| Domain Layer | 85% |
| Infrastructure | 90% |
| Tests | 70% |
| Documentation | 80% |
| **Overall** | **~75%** |

See `PROMPTS.md` for detailed AI prompt log.

## License

MIT
