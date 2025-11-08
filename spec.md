# ShopLite - Event-Driven Microservices Specification

## Project Overview

**Role Target**: Software Development Team Lead
**Timeline**: 72 hours
**Stack**: .NET 8 (C#) or Node.js + PostgreSQL + MongoDB + Kafka + Keycloak
**AI Requirement**: Minimum 70% AI-generated code with comprehensive prompt logging

### Domain

ShopLite is a minimal Order & Inventory management system for a retailer that demonstrates:
- Event-driven choreography pattern
- Clean Architecture across microservices
- OAuth2/OIDC security with role-based access control
- Polyglot persistence (SQL + NoSQL)
- Reliable asynchronous messaging with at-least-once delivery

---

## Development Rules - Do's and Don'ts

### Git Commit Guidelines

#### DO ✅

**Commit Message Format**:
- Use descriptive, clear commit messages
- Keep commits small and focused on single responsibility
- Label AI-generated commits with `AI:` prefix
- Use conventional commit format: `<type>: <description>`

**Commit Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring without functionality change
- `test:` - Adding or updating tests
- `docs:` - Documentation changes
- `chore:` - Build process, dependencies, tooling
- `perf:` - Performance improvements
- `style:` - Code style/formatting changes

**Good Commit Message Examples**:
```bash
AI: generate OrdersController and integration tests
feat: implement outbox pattern for Orders Service
fix: resolve race condition in stock reservation
refactor: extract JWT validation to middleware
test: add unit tests for Order entity validation
docs: update README with Quick Start guide
chore: configure Docker Compose for local development
AI: generate MongoDB repository with optimistic concurrency
feat: add health check endpoints for all services
fix: correct JWKS caching strategy to handle key rotation
```

**Commit Best Practices**:
- Commit after each logical unit of work
- Write in imperative mood ("add feature" not "added feature")
- Keep subject line under 72 characters
- Add body for complex changes explaining WHY (not what)
- Reference issue/ticket numbers when applicable
- Ensure code compiles and tests pass before committing

**AI-Generated Commit Examples**:
```bash
AI: generate Clean Architecture folder structure for Orders Service
AI: create Kafka consumer with retry and DLQ support
AI: implement JWT validation middleware with OIDC discovery
AI: generate PostgreSQL migration for orders and outbox tables
AI: create Event contract schemas with JSON validation
AI: generate integration tests for order creation flow
AI: implement structured logging with correlation IDs
AI: create Dockerfile and docker-compose configuration
```

#### DON'T ❌

**Bad Commit Practices**:
- ❌ `WIP` or `temp` or `fix` without description
- ❌ Committing commented-out code without explanation
- ❌ Mixing multiple unrelated changes in one commit
- ❌ Committing broken/non-compiling code
- ❌ Forgetting to mark AI-generated commits with `AI:` prefix
- ❌ Committing sensitive data (secrets, tokens, credentials)
- ❌ Large commits with 1000+ lines of changes
- ❌ Vague messages like "updates", "changes", "stuff"

**Bad Commit Message Examples**:
```bash
❌ fixed bug
❌ WIP
❌ asdfasdf
❌ updates
❌ more changes
❌ trying to fix
❌ final commit (when it's not actually final)
❌ forgot to add AI: prefix to AI-generated code
```

### Code Organization

#### DO ✅

- ✅ Follow Clean Architecture layer separation strictly
- ✅ Place entities and value objects in Domain layer
- ✅ Keep domain layer framework-free (no ORM attributes)
- ✅ Use dependency injection for all cross-cutting concerns
- ✅ Implement interfaces in Application layer, concrete in Infrastructure
- ✅ Keep controllers thin (delegate to use cases)
- ✅ Use async/await for all I/O operations
- ✅ Implement proper error handling and validation
- ✅ Add XML comments for public APIs
- ✅ Follow SOLID principles
- ✅ Use meaningful variable and method names
- ✅ Keep methods small and focused (<20 lines ideal)
- ✅ Write self-documenting code

#### DON'T ❌

- ❌ Don't put business logic in controllers
- ❌ Don't reference Infrastructure from Domain
- ❌ Don't use static methods for business logic
- ❌ Don't ignore exceptions or use empty catch blocks
- ❌ Don't use magic strings/numbers (use constants/enums)
- ❌ Don't create god classes with too many responsibilities
- ❌ Don't bypass dependency injection with `new` for services
- ❌ Don't mix sync and async code improperly
- ❌ Don't hardcode configuration values
- ❌ Don't leave TODO comments without tracking

### Event-Driven Design

#### DO ✅

- ✅ Always use the outbox pattern for transactional event publishing
- ✅ Include version field in all events for schema evolution
- ✅ Add traceId, correlationId, and timestamp to all events
- ✅ Implement idempotent event handlers
- ✅ Use dead letter queues for failed messages
- ✅ Log all event publishing and consumption
- ✅ Validate event schemas on consumption
- ✅ Design events as immutable facts (past tense)
- ✅ Keep event payloads small and focused
- ✅ Document event contracts with JSON schemas

#### DON'T ❌

- ❌ Don't publish events directly to Kafka without outbox
- ❌ Don't create cyclic event dependencies between services
- ❌ Don't include entire aggregates in events (use IDs)
- ❌ Don't process events synchronously in API requests
- ❌ Don't ignore duplicate events (implement idempotency)
- ❌ Don't change event schemas without versioning
- ❌ Don't use events as RPC/request-response
- ❌ Don't publish events for read operations
- ❌ Don't couple event structure tightly to database schema

### Security

#### DO ✅

- ✅ Validate all JWT tokens (signature, issuer, audience, expiration)
- ✅ Enforce role-based and scope-based authorization
- ✅ Use HTTPS in production (HTTP only for local dev)
- ✅ Validate and sanitize all input data
- ✅ Use parameterized queries to prevent SQL injection
- ✅ Log authentication failures for security monitoring
- ✅ Cache JWKS with appropriate TTL
- ✅ Implement rate limiting on public endpoints
- ✅ Use secure defaults for all configurations
- ✅ Store secrets in environment variables or secret manager

#### DON'T ❌

- ❌ Don't commit credentials, API keys, or secrets to git
- ❌ Don't skip JWT validation in any environment
- ❌ Don't trust client-provided user IDs without validation
- ❌ Don't expose internal error details to clients
- ❌ Don't use weak or predictable tokens
- ❌ Don't disable HTTPS certificate validation
- ❌ Don't log sensitive information (passwords, tokens)
- ❌ Don't allow SQL injection vulnerabilities
- ❌ Don't trust user input without validation

### Testing

#### DO ✅

- ✅ Write unit tests for all business logic
- ✅ Achieve >80% code coverage for Domain and Application layers
- ✅ Write integration tests for critical paths
- ✅ Test both happy and unhappy paths
- ✅ Use test containers for integration tests
- ✅ Test event contract serialization/deserialization
- ✅ Test idempotency of event handlers
- ✅ Mock external dependencies in unit tests
- ✅ Use descriptive test method names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Test edge cases and error conditions

#### DON'T ❌

- ❌ Don't skip tests for "simple" code
- ❌ Don't test implementation details (test behavior)
- ❌ Don't write tests that depend on execution order
- ❌ Don't use production data in tests
- ❌ Don't ignore flaky tests
- ❌ Don't test multiple things in one test
- ❌ Don't mock everything (use real objects when simple)
- ❌ Don't commit commented-out tests
- ❌ Don't skip testing error paths

### Database Design

#### DO ✅

- ✅ Normalize SQL schemas appropriately
- ✅ Create indexes on foreign keys and frequently queried columns
- ✅ Use database migrations for schema changes
- ✅ Implement optimistic concurrency for critical updates
- ✅ Use transactions for multi-table operations
- ✅ Add created_at and updated_at timestamps
- ✅ Use UUIDs for distributed system IDs
- ✅ Document database schema and relationships
- ✅ Plan for data growth (pagination, archival)

**SQL Best Practices**:
```sql
-- ✅ Good: Proper indexing
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_outbox_processed ON outbox(processed_at) WHERE processed_at IS NULL;

-- ✅ Good: Constraints
ALTER TABLE order_items ADD CONSTRAINT qty_positive CHECK (qty > 0);

-- ✅ Good: Optimistic locking
ALTER TABLE orders ADD COLUMN version INT NOT NULL DEFAULT 0;
```

**MongoDB Best Practices**:
```javascript
// ✅ Good: Appropriate indexes
db.products.createIndex({ "sku": 1 }, { unique: true })
db.products.createIndex({ "available": 1 })

// ✅ Good: Schema validation (optional but recommended)
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      required: ["sku", "available", "reserved"],
      properties: {
        available: { bsonType: "int", minimum: 0 },
        reserved: { bsonType: "int", minimum: 0 }
      }
    }
  }
})
```

#### DON'T ❌

- ❌ Don't use SELECT * (specify columns explicitly)
- ❌ Don't forget indexes on foreign keys
- ❌ Don't store sensitive data without encryption
- ❌ Don't use database-specific features if portability matters
- ❌ Don't perform N+1 queries (use eager loading)
- ❌ Don't store large BLOBs in relational databases
- ❌ Don't skip database migrations
- ❌ Don't use reserved keywords as column names

### Logging and Observability

#### DO ✅

- ✅ Use structured logging (JSON format)
- ✅ Include traceId and correlationId in all logs
- ✅ Log at appropriate levels (DEBUG, INFO, WARN, ERROR)
- ✅ Log request/response for critical operations
- ✅ Log event publishing and consumption
- ✅ Include contextual information (orderId, customerId)
- ✅ Implement health check endpoints
- ✅ Expose metrics (request count, duration, errors)
- ✅ Use consistent timestamp format (ISO-8601)

**Good Logging Examples**:
```csharp
// ✅ Good: Structured logging with context
logger.LogInformation(
    "Order created successfully. OrderId: {OrderId}, CustomerId: {CustomerId}, TraceId: {TraceId}",
    orderId, customerId, traceId
);

logger.LogError(
    ex,
    "Failed to reserve stock. OrderId: {OrderId}, SKU: {SKU}, RequestedQty: {Qty}, TraceId: {TraceId}",
    orderId, sku, qty, traceId
);
```

#### DON'T ❌

- ❌ Don't log sensitive data (passwords, credit cards, tokens)
- ❌ Don't use string concatenation for log messages
- ❌ Don't log at wrong levels (INFO for errors, ERROR for normal flow)
- ❌ Don't over-log (flooding logs with noise)
- ❌ Don't under-log (missing critical business events)
- ❌ Don't use Console.WriteLine instead of proper logging
- ❌ Don't ignore log correlation (always include traceId)

**Bad Logging Examples**:
```csharp
// ❌ Bad: No context, string concatenation
logger.LogInformation("Order created: " + orderId);

// ❌ Bad: Logging sensitive data
logger.LogInformation("User logged in with password: {Password}", password);

// ❌ Bad: Wrong log level
logger.LogError("Processing order..."); // Should be INFO

// ❌ Bad: Using Console instead of logger
Console.WriteLine("Order processed");
```

### Docker and Operations

#### DO ✅

- ✅ Use multi-stage builds to minimize image size
- ✅ Run containers as non-root user
- ✅ Use .dockerignore to exclude unnecessary files
- ✅ Pin dependency versions in Dockerfiles
- ✅ Implement graceful shutdown handling
- ✅ Use health checks in docker-compose
- ✅ Configure resource limits
- ✅ Use environment variables for configuration
- ✅ Document all environment variables

**Good Dockerfile Example**:
```dockerfile
# ✅ Good: Multi-stage build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["OrdersService/OrdersService.csproj", "OrdersService/"]
RUN dotnet restore "OrdersService/OrdersService.csproj"
COPY . .
RUN dotnet build "OrdersService/OrdersService.csproj" -c Release -o /app/build
RUN dotnet publish "OrdersService/OrdersService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "OrdersService.dll"]
```

#### DON'T ❌

- ❌ Don't use `latest` tag in production
- ❌ Don't run as root user
- ❌ Don't include secrets in Dockerfile or images
- ❌ Don't install unnecessary packages
- ❌ Don't ignore container exit codes
- ❌ Don't skip health checks
- ❌ Don't use large base images when smaller ones work

### AI Usage and Documentation

#### DO ✅

- ✅ Log every AI prompt in PROMPTS.md
- ✅ Include tool name, context, and result summary
- ✅ Document manual edits made to AI-generated code
- ✅ Mark AI-generated commits with `AI:` prefix
- ✅ Review and understand all AI-generated code
- ✅ Test AI-generated code thoroughly
- ✅ Refactor AI code to match project standards
- ✅ Track AI usage percentage per module
- ✅ Be honest about AI-generated vs manual code

**Good PROMPTS.md Entry**:
```markdown
### Prompt #15: Generate Inventory Repository

**Tool**: ChatGPT-4
**Context**: Infrastructure layer - MongoDB repository for Product entity
**Timestamp**: 2025-01-15 14:30:00

**Prompt**:
```
Create a MongoDB repository in C# for Product entity with:
- Find by SKU
- Atomic update with optimistic concurrency
- Reserve stock operation (decrement available, increment reserved)
- Release stock operation (rollback reservation)
- Include indexes on sku and available fields
```

**Result Summary**:
Generated ProductRepository.cs with all CRUD operations plus specialized stock management methods.

**Manual Edits**:
- Added additional logging for stock operations
- Enhanced error messages for concurrency conflicts
- Added validation for negative stock scenarios
- Improved exception handling

**Outcome**: Accepted with modifications (~75% AI-generated)
```

#### DON'T ❌

- ❌ Don't skip logging prompts to save time
- ❌ Don't claim manual work as AI-generated (or vice versa)
- ❌ Don't blindly accept AI code without review
- ❌ Don't forget `AI:` prefix on commits
- ❌ Don't use AI-generated code you don't understand
- ❌ Don't skip testing AI-generated code
- ❌ Don't ignore AI-generated security vulnerabilities

### Code Review Checklist

Before committing, verify:
- [ ] Code follows Clean Architecture principles
- [ ] All tests pass (unit + integration)
- [ ] No sensitive data in code or commits
- [ ] Proper error handling implemented
- [ ] Logging includes correlation IDs
- [ ] AI-generated commits properly marked
- [ ] Commit message is descriptive
- [ ] Code compiles without warnings
- [ ] Documentation updated if needed
- [ ] No commented-out code left behind

---

## System Architecture

### Microservices

#### 1. API Gateway (Edge/BFF)

**Responsibilities**:
- Validate JWT tokens via OIDC discovery or static JWKS
- Route external requests to downstream services
- Enforce OAuth2 scopes/roles at the edge

**Scopes**:
- `orders.read` - Read order information
- `orders.write` - Create/modify orders
- `inventory.write` - Modify inventory levels

**Endpoints**:
- `POST /orders` → Orders Service (requires `orders.write`, role: `customer`)
- `GET /orders/{id}` → Orders Service (requires `orders.read`)
- `POST /inventory/adjust` → Inventory Service (requires `inventory.write`, role: `admin`)
- `GET /inventory/{sku}` → Inventory Service (role: `admin`)

#### 2. Orders Service (SQL + Clean Architecture)

**Responsibilities**:
- Accept and create customer orders
- Publish `OrderPlaced` events via outbox pattern
- Consume inventory reservation outcomes
- Update order status: `PENDING` → `CONFIRMED` or `CANCELLED`
- Provide order retrieval with authorization (customer sees own orders; admin sees all)

**Database**: PostgreSQL

**Schema**:
```sql
-- Orders aggregate
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, CONFIRMED, CANCELLED
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 0 -- Optimistic locking
);

-- Order line items
CREATE TABLE order_items (
    order_id UUID NOT NULL REFERENCES orders(id),
    line_no INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    PRIMARY KEY (order_id, line_no)
);

-- Transactional outbox for guaranteed event publishing
CREATE TABLE outbox (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_outbox_processed ON outbox(processed_at) WHERE processed_at IS NULL;
```

**Clean Architecture Layers**:
```
/orders-service
  /src
    /Domain
      /Entities (Order, OrderItem)
      /ValueObjects (OrderId, CustomerId, SKU, Quantity)
      /Events (OrderPlacedEvent, OrderConfirmedEvent, OrderCancelledEvent)
      /Interfaces (IOrderRepository)
    /Application
      /UseCases (CreateOrderUseCase, GetOrderUseCase, ConfirmOrderUseCase, CancelOrderUseCase)
      /Ports (IEventPublisher, IUnitOfWork)
      /DTOs (CreateOrderRequest, OrderResponse)
      /Validators (CreateOrderValidator)
    /Infrastructure
      /Persistence (OrderRepository, OutboxRepository, DbContext)
      /Messaging (OutboxDispatcher, KafkaEventPublisher, EventConsumers)
      /Auth (JwtValidator, ScopeEnforcer)
    /Presentation
      /Controllers (OrdersController)
      /Middlewares (AuthenticationMiddleware, ExceptionMiddleware)
      /Contracts (API request/response models)
  /tests
    /Domain
    /Application
    /Integration
```

**Endpoints**:
- `POST /orders` - Create new order (role: `customer`)
  - Request: `{ items: [{ sku: string, qty: number }] }`
  - Response: `201 { orderId: string, status: "PENDING" }`
- `GET /orders/{id}` - Retrieve order (customer sees own; admin sees any)
  - Response: `200 { id, customerId, status, items, createdAt, updatedAt }`

**Events Published**:
- `OrderPlaced` (via outbox)
- `OrderConfirmed` (via outbox, optional)
- `OrderCancelled` (via outbox, optional)

**Events Consumed**:
- `StockReserved` → Confirm order
- `StockRejected` → Cancel order

#### 3. Inventory Service (NoSQL + Clean Architecture)

**Responsibilities**:
- Maintain product inventory with available/reserved stock tracking
- Consume `OrderPlaced` events
- Attempt stock reservation with optimistic concurrency
- Publish `StockReserved` or `StockRejected` events
- Provide admin endpoints for stock adjustment

**Database**: MongoDB

**Schema**:
```javascript
{
  "_id": "ABC",           // Product SKU (primary key)
  "sku": "ABC",           // Denormalized for consistency
  "available": 10,        // Available stock
  "reserved": 0,          // Reserved but not yet confirmed
  "updatedAt": "2025-01-15T10:30:00Z"  // ISO-8601 timestamp
}

// Indexes
db.products.createIndex({ "sku": 1 }, { unique: true })
db.products.createIndex({ "available": 1 })
```

**Clean Architecture Layers**:
```
/inventory-service
  /src
    /Domain
      /Entities (Product)
      /ValueObjects (SKU, StockLevel)
      /Events (StockReservedEvent, StockRejectedEvent)
      /Interfaces (IProductRepository)
    /Application
      /UseCases (ReserveStockUseCase, AdjustStockUseCase, GetProductUseCase)
      /Ports (IEventPublisher)
      /DTOs (AdjustStockRequest, ProductResponse)
      /Validators
    /Infrastructure
      /Persistence (MongoProductRepository, MongoDbContext)
      /Messaging (KafkaEventPublisher, EventConsumers)
      /Auth (JwtValidator)
    /Presentation
      /Controllers (InventoryController)
      /Middlewares
      /Contracts
  /tests
    /Domain
    /Application
    /Integration
```

**Endpoints**:
- `POST /inventory/adjust` - Adjust stock levels (role: `admin`)
  - Request: `{ sku: string, delta: number }`
  - Response: `200 { sku, available, reserved }`
- `GET /inventory/{sku}` - Get product inventory (role: `admin`)
  - Response: `200 { sku, available, reserved, updatedAt }`

**Events Published**:
- `StockReserved` - Successful reservation
- `StockRejected` - Insufficient stock

**Events Consumed**:
- `OrderPlaced` → Attempt stock reservation

#### 4. Optional: Query/Read Model Service

**Purpose**: Optimized read projections for admin dashboards

**Responsibilities**:
- Consume domain events
- Build denormalized views
- Provide fast query endpoints

---

## Event Contracts

All events use JSON format with versioning for backward compatibility.

### Common Event Metadata

All events include:
- `traceId` - Distributed tracing correlation ID
- `correlationId` - Business process correlation ID
- `ts` - ISO-8601 timestamp
- `version` - Event schema version

### Event Definitions

#### OrderPlaced v1

```json
{
  "type": "OrderPlaced",
  "version": 1,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "auth0|user123",
  "items": [
    {
      "sku": "ABC",
      "qty": 2
    }
  ],
  "traceId": "trace-uuid",
  "correlationId": "correlation-uuid",
  "ts": "2025-01-15T10:30:00Z"
}
```

**Published by**: Orders Service
**Consumed by**: Inventory Service

#### StockReserved v1

```json
{
  "type": "StockReserved",
  "version": 1,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "reservations": [
    {
      "sku": "ABC",
      "qty": 2
    }
  ],
  "traceId": "trace-uuid",
  "correlationId": "correlation-uuid",
  "ts": "2025-01-15T10:30:05Z"
}
```

**Published by**: Inventory Service
**Consumed by**: Orders Service

#### StockRejected v1

```json
{
  "type": "StockRejected",
  "version": 1,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "INSUFFICIENT_STOCK",
  "details": [
    {
      "sku": "ABC",
      "requested": 2,
      "available": 1
    }
  ],
  "traceId": "trace-uuid",
  "correlationId": "correlation-uuid",
  "ts": "2025-01-15T10:30:05Z"
}
```

**Published by**: Inventory Service
**Consumed by**: Orders Service

#### OrderConfirmed v1

```json
{
  "type": "OrderConfirmed",
  "version": 1,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "auth0|user123",
  "status": "CONFIRMED",
  "traceId": "trace-uuid",
  "correlationId": "correlation-uuid",
  "ts": "2025-01-15T10:30:07Z"
}
```

**Published by**: Orders Service
**Consumed by**: Optional read models

#### OrderCancelled v1

```json
{
  "type": "OrderCancelled",
  "version": 1,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "auth0|user123",
  "status": "CANCELLED",
  "reason": "INSUFFICIENT_STOCK",
  "traceId": "trace-uuid",
  "correlationId": "correlation-uuid",
  "ts": "2025-01-15T10:30:07Z"
}
```

**Published by**: Orders Service
**Consumed by**: Optional read models

---

## Event Flow - Order Saga (Choreography)

### Happy Path: Stock Available

```
1. Customer → API Gateway: POST /orders
2. API Gateway → Orders Service: Create order (authenticated)
3. Orders Service:
   - Persist order (status: PENDING)
   - Write OrderPlaced event to outbox
   - Commit transaction
   - Return 201 { orderId, status: "PENDING" }
4. Outbox Dispatcher → Kafka: Publish OrderPlaced event
5. Inventory Service ← Kafka: Consume OrderPlaced
6. Inventory Service:
   - Check available stock
   - Reserve stock (atomic update: available -= qty, reserved += qty)
   - Publish StockReserved event
7. Orders Service ← Kafka: Consume StockReserved
8. Orders Service:
   - Update order status to CONFIRMED
   - Publish OrderConfirmed event (optional)
```

### Unhappy Path: Insufficient Stock

```
1-5. [Same as happy path]
6. Inventory Service:
   - Check available stock
   - Insufficient stock detected
   - Publish StockRejected event
7. Orders Service ← Kafka: Consume StockRejected
8. Orders Service:
   - Update order status to CANCELLED
   - Publish OrderCancelled event (optional)
```

---

## OAuth2/OIDC Security

### Authentication Provider

**Keycloak** (containerized) or static JWKS for local development

### Realm Configuration

**Realm**: `shoplite`

**Clients**:
- `shoplite-api` - Confidential client for service-to-service
- `shoplite-web` - Public client for frontend

**Roles**:
- `customer` - Can create and view own orders
- `admin` - Full access to orders and inventory

**Scopes**:
- `orders.read` - Read order information
- `orders.write` - Create/modify orders
- `inventory.write` - Modify inventory
- `inventory.read` - Read inventory

### JWT Validation

**At API Gateway**:
1. Extract JWT from `Authorization: Bearer <token>` header
2. Discover JWKS from `{ISSUER}/.well-known/openid-configuration`
3. Cache JWKS with TTL (e.g., 1 hour)
4. Validate token:
   - Signature verification
   - `iss` (issuer) validation
   - `aud` (audience) validation
   - `exp` (expiration) check
   - Scope/role claims validation
5. Forward validated claims to downstream services

**JWKS Rotation Strategy**:
- Cache JWKS for 1 hour
- On signature verification failure, force JWKS refresh
- Support multiple active keys during rotation

### Sample Token Claims

**Customer Token**:
```json
{
  "sub": "auth0|user123",
  "iss": "http://keycloak:8080/realms/shoplite",
  "aud": "shoplite-api",
  "exp": 1736944200,
  "iat": 1736940600,
  "roles": ["customer"],
  "scope": "orders.read orders.write"
}
```

**Admin Token**:
```json
{
  "sub": "auth0|admin456",
  "iss": "http://keycloak:8080/realms/shoplite",
  "aud": "shoplite-api",
  "exp": 1736944200,
  "iat": 1736940600,
  "roles": ["admin"],
  "scope": "orders.read orders.write inventory.read inventory.write"
}
```

### Token Generation Script

Provide script/documentation to generate sample tokens:
- Customer token with `orders.read`, `orders.write`
- Admin token with full scopes

---

## Messaging & Reliability

### Message Broker

**Primary**: Apache Kafka
**Alternatives**: RabbitMQ, Redis Streams

### Kafka Topics

- `orders.placed` - OrderPlaced events
- `inventory.stock-reserved` - StockReserved events
- `inventory.stock-rejected` - StockRejected events
- `orders.confirmed` - OrderConfirmed events (optional)
- `orders.cancelled` - OrderCancelled events (optional)
- `*.dlq` - Dead Letter Queue for each topic

### Outbox Pattern (Orders Service)

**Purpose**: Guarantee event publishing with transactional consistency

**Implementation**:
1. Business logic writes to `orders` table and `outbox` table in same transaction
2. Background dispatcher polls `outbox` table for unprocessed events
3. Publishes events to Kafka
4. Marks events as processed (`processed_at = NOW()`)
5. Retry on failure with exponential backoff

**Dispatcher Configuration**:
- Poll interval: 100ms
- Batch size: 100 events
- Retry strategy: Exponential backoff (1s, 2s, 4s, 8s, max 60s)

### Consumer Idempotency

**Strategy**: Track processed event IDs per consumer

**Implementation**:
1. Include `eventId` (UUID) in all events
2. Consumer maintains processed event log (in-memory cache + DB)
3. Check `eventId` before processing
4. Skip duplicate events
5. Periodic cleanup of old event IDs (e.g., > 7 days)

**Alternative**: Use `orderId` as natural idempotency key for order-related events

### At-Least-Once Delivery

**Consumer Configuration**:
- Manual offset commit
- Commit only after successful processing and DB persistence
- Enable auto-commit: `false`
- Isolation level: `read_committed`

### Dead Letter Queue (DLQ)

**Strategy**:
1. Retry failed message processing 3 times with backoff
2. After max retries, publish to DLQ topic
3. Log error details with full context
4. Alert on DLQ messages
5. Manual review and reprocessing workflow

**DLQ Message Format**:
```json
{
  "originalTopic": "orders.placed",
  "originalPartition": 0,
  "originalOffset": 12345,
  "failureReason": "Database connection timeout",
  "failureTimestamp": "2025-01-15T10:30:00Z",
  "retryCount": 3,
  "originalPayload": { ... }
}
```

### Event Headers

All Kafka messages include headers:
- `event-id` - Unique event identifier (UUID)
- `trace-id` - Distributed tracing ID
- `correlation-id` - Business correlation ID
- `event-type` - Event type (e.g., "OrderPlaced")
- `event-version` - Schema version (e.g., "1")
- `source-service` - Publishing service name
- `timestamp` - ISO-8601 timestamp

---

## Clean Architecture Requirements

### Dependency Rule

**Core Principle**: Dependencies point inward. Inner layers define interfaces; outer layers implement them.

```
Presentation → Application → Domain
       ↓            ↓
   Infrastructure ←┘
```

**Rules**:
1. Domain layer has ZERO external dependencies (pure business logic)
2. Application layer depends only on Domain
3. Infrastructure implements interfaces from Application/Domain
4. Presentation depends on Application (uses use cases)

### Layer Responsibilities

#### Domain Layer
- **Entities**: Core business objects (Order, OrderItem, Product)
- **Value Objects**: Immutable domain concepts (OrderId, SKU, Quantity)
- **Domain Events**: Business events (OrderCreated, StockReserved)
- **Repository Interfaces**: Data access contracts
- **Domain Services**: Complex business logic spanning multiple entities
- **Business Rules**: Validation, constraints, invariants

**No Dependencies**: Framework-free, pure business logic

#### Application Layer
- **Use Cases**: Application-specific business rules (CreateOrder, ReserveStock)
- **Ports**: Interfaces for external systems (IEventPublisher, IUnitOfWork)
- **DTOs**: Data transfer objects for use case inputs/outputs
- **Validators**: Input validation logic
- **Application Services**: Orchestration of domain objects

**Dependencies**: Domain layer only

#### Infrastructure Layer
- **Repositories**: Concrete data access implementations
- **Event Publishers**: Message broker adapters
- **External Services**: Third-party integrations
- **Database Contexts**: ORM configurations
- **Authentication**: JWT validation, OIDC discovery
- **Outbox Dispatcher**: Background job for event publishing

**Dependencies**: Domain, Application, external frameworks

#### Presentation Layer
- **Controllers**: HTTP endpoints
- **Middlewares**: Cross-cutting concerns (auth, logging, exception handling)
- **Request/Response Models**: API contracts
- **Dependency Injection**: Service registration

**Dependencies**: Application layer (uses use cases)

### Dependency Injection

**Registration Pattern**:
```csharp
// Domain - no registration needed (pure logic)

// Application
services.AddScoped<ICreateOrderUseCase, CreateOrderUseCase>();

// Infrastructure
services.AddScoped<IOrderRepository, OrderRepository>();
services.AddScoped<IEventPublisher, KafkaEventPublisher>();
services.AddSingleton<IOutboxDispatcher, OutboxDispatcher>();

// Presentation
services.AddControllers();
```

### Deviations & Trade-offs

Document any deviations from pure Clean Architecture:
- Using framework attributes in Domain (e.g., ORM annotations) - explain why
- Combining Application/Domain in smaller services - justify
- Infrastructure dependencies in tests - acceptable for integration tests

---

## Observability

### Structured Logging

**Format**: JSON
**Required Fields**:
- `timestamp` - ISO-8601
- `level` - DEBUG, INFO, WARN, ERROR
- `service` - Service name
- `traceId` - Distributed trace ID
- `correlationId` - Business correlation ID
- `orderId` - Order identifier (when applicable)
- `message` - Log message
- `context` - Additional structured data

**Example**:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "service": "orders-service",
  "traceId": "trace-123",
  "correlationId": "corr-456",
  "orderId": "order-789",
  "message": "Order created successfully",
  "context": {
    "customerId": "auth0|user123",
    "itemCount": 2
  }
}
```

### Metrics

**Framework**: Prometheus-compatible metrics

**Required Metrics**:
- **Request Count**: HTTP request count by endpoint, method, status code
- **Request Duration**: Latency histogram by endpoint
- **Error Rate**: Error count and percentage by endpoint
- **Reservation Success Rate**: Stock reservation success/failure ratio
- **Outbox Queue Depth**: Unprocessed events in outbox
- **Consumer Lag**: Kafka consumer lag per topic/partition
- **Database Connection Pool**: Active/idle connections

**Example Metrics**:
```
http_requests_total{service="orders",method="POST",endpoint="/orders",status="201"} 1234
http_request_duration_seconds{service="orders",endpoint="/orders",quantile="0.95"} 0.123
stock_reservation_success_total{service="inventory"} 890
stock_reservation_failure_total{service="inventory",reason="insufficient_stock"} 45
outbox_queue_depth{service="orders"} 12
```

### Health Checks

**Endpoint**: `GET /_health`
**Response Format**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms"
    },
    "messageBroker": {
      "status": "healthy",
      "responseTime": "12ms"
    },
    "oidc": {
      "status": "healthy",
      "responseTime": "8ms"
    }
  }
}
```

**Status Codes**:
- `200 OK` - All checks healthy
- `503 Service Unavailable` - One or more checks unhealthy

**Protection**: Document whether health endpoints are protected or public

---

## Testing Strategy

### Unit Tests

**Scope**: Domain and Application layers
**Framework**: xUnit (.NET) or Jest (Node.js)
**Coverage Target**: >80%

**Examples**:
- Domain entity validation
- Value object immutability
- Use case business logic
- Event contract serialization

### Integration Tests

**Scope**: Full service with real infrastructure
**Setup**: Testcontainers for DB, Kafka

**Examples**:
- API endpoint with real database
- Event publishing via outbox
- Event consumption and order status update
- JWT authentication/authorization

### Event Contract Tests

**Purpose**: Ensure event schema compatibility

**Approach**:
- Schema validation (JSON Schema)
- Version compatibility tests
- Serialization/deserialization tests

### End-to-End Scenarios

**Happy Path**:
1. Create order with available stock
2. Verify order status changes to CONFIRMED
3. Verify stock levels updated

**Insufficient Stock**:
1. Create order with unavailable stock
2. Verify order status changes to CANCELLED
3. Verify stock levels unchanged

**Idempotency**:
1. Publish duplicate OrderPlaced event
2. Verify stock reserved only once
3. Verify no duplicate order status updates

### Test Commands

```bash
# Unit tests
dotnet test --filter Category=Unit

# Integration tests
dotnet test --filter Category=Integration

# All tests with coverage
dotnet test /p:CollectCoverage=true /p:CoverageReportsDirectory=./coverage
```

---

## Deployment & Operations

### Docker Compose

**One-command startup**: `docker-compose up`

**Services**:
- `postgres` - PostgreSQL for Orders Service
- `mongo` - MongoDB for Inventory Service
- `kafka` - Apache Kafka message broker
- `zookeeper` - Kafka coordination
- `keycloak` - OAuth2/OIDC provider
- `gateway` - API Gateway
- `orders-service` - Orders microservice
- `inventory-service` - Inventory microservice

**Environment Variables**:
```yaml
# Orders Service
POSTGRES_CONNECTION_STRING=Host=postgres;Database=orders;Username=postgres;Password=postgres
KAFKA_BROKERS=kafka:9092
OIDC_AUTHORITY=http://keycloak:8080/realms/shoplite

# Inventory Service
MONGO_CONNECTION_STRING=mongodb://mongo:27017
KAFKA_BROKERS=kafka:9092
OIDC_AUTHORITY=http://keycloak:8080/realms/shoplite

# Gateway
OIDC_AUTHORITY=http://keycloak:8080/realms/shoplite
ORDERS_SERVICE_URL=http://orders-service:5001
INVENTORY_SERVICE_URL=http://inventory-service:5002
```

### Database Migrations

**Orders Service (PostgreSQL)**:
- Use Entity Framework Core Migrations (.NET) or Flyway
- Apply on startup or manual command
- Version-controlled migration scripts

**Inventory Service (MongoDB)**:
- Schema-less, but seed initial data
- Index creation scripts
- Document validation rules (optional)

### Keycloak Setup

**Automated Configuration**:
- Realm import via JSON file
- Client configuration
- Role/scope definitions
- Test user creation

**Realm Export**: Include in `/ops/keycloak-realm.json`

---

## API Documentation

### OpenAPI/Swagger

Generate and expose API documentation:
- Swagger UI available at `/swagger`
- OpenAPI spec at `/swagger/v1/swagger.json`
- Include authentication requirements
- Example requests/responses

### Postman Collection

Provide Postman collection with:
- Environment variables (base URL, tokens)
- All endpoints with examples
- Pre-request scripts for token generation
- Test assertions for happy/unhappy paths

**Collection Structure**:
```
ShopLite API
├─ Authentication
│  ├─ Get Customer Token
│  └─ Get Admin Token
├─ Orders
│  ├─ Create Order (Happy Path)
│  ├─ Create Order (Insufficient Stock)
│  └─ Get Order by ID
└─ Inventory (Admin)
   ├─ Adjust Stock
   └─ Get Product
```

---

## Repository Structure

```
/
├─ gateway/
│  ├─ src/
│  ├─ tests/
│  ├─ Dockerfile
│  └─ README.md
├─ orders-service/
│  ├─ src/
│  │  ├─ Domain/
│  │  ├─ Application/
│  │  ├─ Infrastructure/
│  │  └─ Presentation/
│  ├─ tests/
│  │  ├─ Domain/
│  │  ├─ Application/
│  │  └─ Integration/
│  ├─ Dockerfile
│  └─ README.md
├─ inventory-service/
│  ├─ src/
│  │  ├─ Domain/
│  │  ├─ Application/
│  │  ├─ Infrastructure/
│  │  └─ Presentation/
│  ├─ tests/
│  │  ├─ Domain/
│  │  ├─ Application/
│  │  └─ Integration/
│  ├─ Dockerfile
│  └─ README.md
├─ contracts/
│  ├─ events/
│  │  ├─ OrderPlaced.v1.schema.json
│  │  ├─ StockReserved.v1.schema.json
│  │  ├─ StockRejected.v1.schema.json
│  │  └─ ...
│  └─ README.md
├─ ops/
│  ├─ docker-compose.yml
│  ├─ keycloak-realm.json
│  └─ postgres-init.sql
├─ tests/
│  ├─ e2e/
│  └─ postman/
│     └─ ShopLite.postman_collection.json
├─ docs/
│  ├─ architecture/
│  │  ├─ c4-context.puml
│  │  ├─ c4-container.puml
│  │  └─ sequence-order-saga.puml
│  ├─ decisions/
│  │  └─ 001-choreography-vs-orchestration.md
│  └─ images/
├─ README.md
├─ PROMPTS.md
└─ .gitignore
```

---

## AI Usage Requirements

### Prompt Logging (PROMPTS.md)

**Required Information**:
1. **AI Tool Used**: ChatGPT-4, GitHub Copilot, Cursor, Claude, etc.
2. **Prompt**: Full prompt text
3. **Context**: Why this prompt was needed (architecture, code, test, docs)
4. **Result Summary**: What was generated
5. **Manual Edits**: Changes made to AI output
6. **Outcome**: Accepted, modified, or rejected

**Example Entry**:
```markdown
### Prompt #12: Generate Orders Repository

**Tool**: ChatGPT-4
**Context**: Infrastructure layer - needed PostgreSQL repository implementation
**Timestamp**: 2025-01-15 10:30:00

**Prompt**:
```
Generate a .NET 8 Entity Framework Core repository implementation for Order entity with:
- Generic repository pattern
- Async methods
- Include support for eager loading order items
- Optimistic concurrency handling with version field
- Transaction support
```

**Result Summary**:
Generated OrderRepository.cs with full CRUD operations, async/await, and EF Core optimistic concurrency.

**Manual Edits**:
- Added custom query for GetOrdersByCustomerId with pagination
- Modified Update method to handle version mismatch exception
- Added logging statements

**Outcome**: Accepted with modifications (~80% AI-generated)
```

### AI-Generated Code Markers

**Commit Messages**:
- Prefix AI-generated commits with `AI:`
- Example: `AI: generate OrdersController and integration tests`

**Pull Request Descriptions**:
- Section listing AI-generated components
- Percentage breakdown by module

**Code Comments** (optional):
```csharp
// AI-Generated: ChatGPT-4 (2025-01-15)
// Manual modifications: Added validation, error handling
public class OrderRepository : IOrderRepository
{
    // ...
}
```

### Minimum AI Usage

**Target**: ≥70% of code AI-generated

**Acceptable AI Usage**:
- Entity/model generation
- Repository implementations
- Controller scaffolding
- Test case generation
- Docker configuration
- Event contract schemas
- Documentation structure

**Expected Manual Work**:
- Architecture decisions
- Business logic refinement
- Security configurations
- Performance optimizations
- Edge case handling
- Integration debugging

---

## Acceptance Criteria

### Functional Requirements

- [ ] Customer can create order with valid JWT token
- [ ] Order status changes to CONFIRMED when stock is available
- [ ] Order status changes to CANCELLED when stock is insufficient
- [ ] Admin can adjust inventory stock levels
- [ ] Customer can only view their own orders
- [ ] Admin can view any order
- [ ] Unauthorized requests are rejected with 401/403

### Event-Driven Requirements

- [ ] OrderPlaced event published via outbox pattern
- [ ] Outbox dispatcher reliably publishes events to Kafka
- [ ] Inventory service consumes OrderPlaced and publishes outcome
- [ ] Orders service consumes inventory outcomes and updates status
- [ ] Idempotent event processing (duplicate events handled correctly)
- [ ] Dead letter queue captures failed messages
- [ ] Events include traceId, correlationId, and timestamp

### Security Requirements

- [ ] JWT validation using OIDC discovery or static JWKS
- [ ] Token signature verification
- [ ] Issuer, audience, and expiration validation
- [ ] Role-based access control enforced
- [ ] Scope-based authorization for endpoints
- [ ] JWKS caching implemented
- [ ] Sample tokens or generation script provided

### Database Requirements

- [ ] PostgreSQL schema with orders, order_items, outbox tables
- [ ] MongoDB schema with products collection
- [ ] Appropriate indexes defined
- [ ] Database migrations implemented
- [ ] Optimistic concurrency for inventory updates
- [ ] Transactional consistency for order creation + outbox

### Clean Architecture Requirements

- [ ] Clear separation of Domain, Application, Infrastructure, Presentation layers
- [ ] Dependency rule enforced (dependencies point inward)
- [ ] Domain layer has no framework dependencies
- [ ] Repository interfaces defined in Domain
- [ ] Use cases orchestrate domain logic
- [ ] Dependency diagram provided
- [ ] Deviations documented

### Operations Requirements

- [ ] `docker-compose up` starts all services
- [ ] Health checks implemented for each service
- [ ] Structured JSON logging with traceId/correlationId
- [ ] Basic metrics exposed (request count, error rate, etc.)
- [ ] Database and broker health checks
- [ ] Services start in correct order with health dependencies

### Testing Requirements

- [ ] Unit tests for domain logic (>80% coverage)
- [ ] Unit tests for use cases
- [ ] Integration tests with real database and Kafka
- [ ] Event contract validation tests
- [ ] End-to-end happy path scenario
- [ ] End-to-end insufficient stock scenario
- [ ] Idempotency test
- [ ] Postman collection or cURL examples provided

### Documentation Requirements

- [ ] README.md with architecture overview
- [ ] How to run instructions
- [ ] How to test instructions
- [ ] Known limitations and next steps
- [ ] C4 Context diagram
- [ ] C4 Container diagram
- [ ] Sequence diagram for order saga
- [ ] PROMPTS.md with AI usage log (≥70% AI-generated)
- [ ] AI usage declaration in README

---

## Evaluation Rubric (100 Points)

### Architecture & Clean Architecture (25 points)

**Excellent (23-25)**:
- Perfect layer separation with clear boundaries
- Dependency rule strictly enforced
- Well-defined ports and adapters
- Comprehensive dependency diagrams
- Thoughtful architecture decision documentation

**Good (18-22)**:
- Clear layer separation
- Minor dependency rule violations (documented)
- Good port/adapter pattern usage
- Basic dependency diagram

**Satisfactory (15-17)**:
- Layers identifiable but some mixing
- Some framework dependencies in domain
- Adapters present but not fully abstracted

**Needs Improvement (<15)**:
- Unclear layer boundaries
- Significant dependency violations
- Missing or poor adapter patterns

### Event-Driven Design & Reliability (20 points)

**Excellent (18-20)**:
- Robust outbox implementation
- Idempotent consumers with deduplication
- Well-versioned events with schema validation
- Clear choreography pattern
- DLQ with retry/backoff strategy
- Comprehensive correlation/tracing

**Good (15-17)**:
- Working outbox pattern
- Basic idempotency
- Versioned events
- Good choreography
- Basic DLQ

**Satisfactory (12-14)**:
- Basic event publishing
- Some idempotency considerations
- Event versioning present

**Needs Improvement (<12)**:
- No outbox or unreliable publishing
- Missing idempotency
- Poor event design

### OAuth2/OIDC Security (15 points)

**Excellent (14-15)**:
- Complete JWT validation with all checks
- JWKS caching with rotation strategy
- Proper scope and role enforcement
- Sample tokens or easy token generation
- Secure defaults throughout

**Good (11-13)**:
- JWT validation working
- Basic JWKS handling
- Role enforcement present
- Token examples provided

**Satisfactory (9-10)**:
- Basic JWT validation
- Some security checks
- Authentication working

**Needs Improvement (<9)**:
- Incomplete JWT validation
- Missing role enforcement
- Security vulnerabilities

### Database Design (SQL & NoSQL) (15 points)

**Excellent (14-15)**:
- Well-normalized SQL schema
- Appropriate NoSQL schema design
- Proper indexes on both
- Migrations implemented
- Optimistic concurrency handled
- Excellent data modeling

**Good (11-13)**:
- Good schema design
- Basic indexes
- Migrations present
- Concurrency considered

**Satisfactory (9-10)**:
- Functional schemas
- Some indexes
- Basic migrations

**Needs Improvement (<9)**:
- Poor schema design
- Missing indexes
- No migrations

### Code Quality & Tests (15 points)

**Excellent (14-15)**:
- >80% unit test coverage
- Comprehensive integration tests
- Event contract tests
- Clean, readable code
- Consistent style
- Good error handling

**Good (11-13)**:
- 60-80% test coverage
- Basic integration tests
- Clean code
- Good error handling

**Satisfactory (9-10)**:
- 40-60% test coverage
- Some integration tests
- Acceptable code quality

**Needs Improvement (<9)**:
- <40% test coverage
- Missing critical tests
- Poor code quality

### Operations (10 points)

**Excellent (9-10)**:
- One-command startup works perfectly
- Comprehensive health checks
- Structured logging everywhere
- Metrics implemented
- Excellent observability

**Good (7-8)**:
- Docker compose works
- Basic health checks
- Structured logging present
- Some metrics

**Satisfactory (5-6)**:
- Services start with minor issues
- Basic health checks
- Logging present

**Needs Improvement (<5)**:
- Difficult to start
- Missing health checks
- Poor logging

### Bonus Points (+30 max)

**Well-Reasoned Assumptions (+10)**:
- Clear documentation of ambiguities
- Thoughtful decisions with rationale
- Architecture Decision Records (ADRs)

**Additional Features (+10)**:
- Read model/CQRS implementation
- Advanced monitoring/alerting
- Performance optimizations
- Additional test scenarios

**Exceptional Documentation (+10)**:
- Outstanding README
- Comprehensive diagrams
- Video walkthrough
- Clear prompt log

---

## Trade-offs & Design Decisions

### Choreography vs Orchestration

**Decision**: Use choreography (event-driven) over orchestration (saga coordinator)

**Rationale**:
- **Pros**:
  - Services remain decoupled
  - No single point of failure
  - Easier to add new services
  - Natural event sourcing evolution path
- **Cons**:
  - Harder to visualize full flow
  - No central place to track saga state
  - Debugging distributed flow more complex
  - Potential for cyclic dependencies

**When to reconsider**: If saga complexity grows (>5 steps), or if need central monitoring, switch to orchestration with saga coordinator.

### Outbox vs Transactional Outbox Library

**Decision**: Implement custom outbox pattern vs using library (e.g., Debezium)

**Rationale**:
- **Custom implementation**:
  - Full control and learning opportunity
  - Simpler for small-scale systems
  - No external dependencies
- **Library (Debezium)**:
  - Production-ready, battle-tested
  - CDC (Change Data Capture) support
  - Better performance at scale

**Recommendation**: Start with custom for learning; migrate to Debezium for production.

### Kafka vs RabbitMQ

**Decision**: Kafka recommended, but RabbitMQ acceptable

**Kafka Pros**:
- Better for event streaming
- Built-in partitioning and ordering
- Event replay capability
- Higher throughput

**RabbitMQ Pros**:
- Simpler setup
- Better for request/reply patterns
- Built-in DLQ support
- Easier local development

### Event Versioning Strategy

**Decision**: Include version field in event payload

**Alternative Approaches**:
- Topic-based versioning (orders.placed.v1, orders.placed.v2)
- Schema registry (Avro with Confluent Schema Registry)

**Trade-off**: Simple JSON versioning is easier to implement but requires consumer version handling logic.

---

## Known Limitations & Next Steps

### Known Limitations

1. **No Event Replay**: Current implementation doesn't support replaying events from history
2. **Limited Monitoring**: Basic metrics only; no distributed tracing UI
3. **No Compensation**: Order cancellation doesn't auto-release reserved stock
4. **Single Instance**: No horizontal scaling or load balancing configured
5. **Simplified Auth**: No refresh token flow or token revocation
6. **No Rate Limiting**: API endpoints not protected against abuse

### Next Steps

1. **Event Sourcing**: Migrate to full event sourcing for Order aggregate
2. **CQRS**: Implement read models for optimized queries
3. **Compensation**: Add compensating transactions for stock release
4. **Observability**: Integrate OpenTelemetry for distributed tracing
5. **Resilience**: Add circuit breakers, retries, timeouts (Polly/.NET)
6. **Scaling**: Kubernetes deployment with horizontal pod autoscaling
7. **Security**: Implement rate limiting, API keys, refresh tokens
8. **Monitoring**: Add Grafana dashboards and Prometheus alerts

---

## Quick Start Guide

### Prerequisites

- Docker & Docker Compose
- .NET 8 SDK (if running locally) OR Node.js 18+ (if using Node.js)
- PostgreSQL client (optional, for DB inspection)
- Kafka CLI tools (optional, for event inspection)

### Setup

```bash
# Clone repository
git clone <repo-url>
cd shoplite

# Start all services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Check health endpoints
curl http://localhost:8080/_health  # Gateway
curl http://localhost:5001/_health  # Orders Service
curl http://localhost:5002/_health  # Inventory Service
```

### Testing

```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:8080/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.access_token')

# Seed inventory
curl -X POST http://localhost:8080/inventory/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"ABC","delta":100}'

# Create order (customer token)
CUSTOMER_TOKEN=$(curl -X POST http://localhost:8080/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"customer"}' | jq -r '.access_token')

ORDER_ID=$(curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"sku":"ABC","qty":2}]}' | jq -r '.orderId')

# Check order status (should become CONFIRMED)
curl http://localhost:8080/orders/$ORDER_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

---

## Starter Prompts (AI Development Accelerators)

Use these prompts with your AI tool (ChatGPT-4, GitHub Copilot, Cursor, Claude, etc.) to speed up development. **Remember to log ALL prompts in PROMPTS.md!**

### 1. Clean Architecture Setup

**Prompt**:
```
Generate a Clean Architecture folder structure for a .NET 8 microservice named Orders with Domain, Application, Infrastructure, Presentation layers. Include:
- Domain: Entities (Order, OrderItem), Value Objects (OrderId, SKU), Repository interfaces
- Application: Use cases (CreateOrder, GetOrder), DTOs, Validators
- Infrastructure: EF Core DbContext, Repositories, Kafka event publisher
- Presentation: ASP.NET Core controllers, middlewares, dependency injection setup
- Example Order entity with id, customer_id, status, version (optimistic locking)
- Proper DI registration in Program.cs
```

**Expected Output**: Complete folder structure with example files for each layer

---

### 2. Outbox Pattern Implementation

**Prompt**:
```
In .NET 8 with EF Core and PostgreSQL, implement an Outbox pattern with:
- Outbox table (id, aggregate_id, type, payload JSONB, created_at, processed_at)
- Background dispatcher service using IHostedService
- Exactly-once-ish semantics (mark events as processed atomically)
- Retry logic with exponential backoff
- Publishing to Kafka using Confluent.Kafka
- EF Core migration for outbox table
- Unit tests for outbox dispatcher
- Integration test verifying event publishing
```

**Expected Output**: Complete outbox implementation with dispatcher, migration, and tests

---

### 3. Resilient Kafka Consumer

**Prompt**:
```
Create a resilient Kafka consumer in .NET 8 using Confluent.Kafka with:
- Consumer for OrderPlaced events
- Retry mechanism with exponential backoff (1s, 2s, 4s, 8s, max 60s)
- Idempotency handling using event ID tracking (in-memory cache + database)
- Dead Letter Queue (DLQ) topic for failed messages after max retries
- Manual offset commit (only after successful processing)
- Structured logging with traceId and correlationId
- Graceful shutdown handling
- Health check integration
```

**Expected Output**: Production-ready Kafka consumer with reliability patterns

---

### 4. JWT Validation Middleware

**Prompt**:
```
Validate JWT from Keycloak discovery endpoint in ASP.NET Core:
- OIDC discovery from {ISSUER}/.well-known/openid-configuration
- JWKS endpoint discovery and caching (1 hour TTL)
- Validate signature, issuer, audience, expiration
- Extract roles and scopes from claims
- Enforce scope "orders.write" on POST /orders endpoint
- Enforce role "customer" or "admin"
- Cache JWKS with refresh on validation failure (key rotation support)
- Return 401 for invalid tokens, 403 for insufficient scopes
- Structured logging for auth failures
```

**Expected Output**: JWT validation middleware with OIDC integration and scope enforcement

---

### 5. MongoDB Repository with Optimistic Concurrency

**Prompt**:
```
Create a MongoDB repository for Product entity in C# with:
- Product schema: _id (SKU), sku, available (int), reserved (int), updatedAt (ISO-8601)
- Find by SKU method
- Reserve stock operation (atomic: decrement available, increment reserved)
- Release stock operation (increment available, decrement reserved)
- Optimistic concurrency using updatedAt timestamp
- Proper error handling for concurrency conflicts
- Indexes on sku (unique) and available fields
- MongoDB connection setup with dependency injection
- Unit tests with in-memory MongoDB (or mocks)
```

**Expected Output**: Complete MongoDB repository with concurrency control

---

### 6. Event Contract Schemas

**Prompt**:
```
Generate JSON Schema definitions for event contracts:
1. OrderPlaced v1: type, version, orderId (UUID), customerId, items[{sku, qty}], traceId, correlationId, ts
2. StockReserved v1: type, version, orderId, reservations[{sku, qty}], traceId, correlationId, ts
3. StockRejected v1: type, version, orderId, reason, details[{sku, requested, available}], traceId, correlationId, ts
4. OrderConfirmed v1: type, version, orderId, customerId, status, traceId, correlationId, ts
5. OrderCancelled v1: type, version, orderId, customerId, status, reason, traceId, correlationId, ts

Include JSON Schema validation for each contract with required fields, data types, and constraints.
```

**Expected Output**: JSON Schema files for all event contracts

---

### 7. Sequence Diagram (PlantUML)

**Prompt**:
```
Create a PlantUML sequence diagram for the order saga choreography:

Actors: Customer, API Gateway, Orders Service, Inventory Service, Kafka

Happy Path Flow:
1. Customer → API Gateway: POST /orders
2. API Gateway → Orders Service: Create order (JWT validated)
3. Orders Service: Save order (PENDING) + outbox entry (OrderPlaced)
4. Orders Service → Kafka: Publish OrderPlaced
5. Kafka → Inventory Service: OrderPlaced event
6. Inventory Service: Reserve stock (atomic update)
7. Inventory Service → Kafka: Publish StockReserved
8. Kafka → Orders Service: StockReserved event
9. Orders Service: Update order status (CONFIRMED)
10. Orders Service → Customer: Return order details

Unhappy Path (Insufficient Stock):
- After step 5, Inventory Service publishes StockRejected
- Orders Service updates order status to CANCELLED

Include notes for idempotency, outbox pattern, and optimistic locking.
```

**Expected Output**: Complete PlantUML sequence diagram

---

### 8. Docker Compose Configuration

**Prompt**:
```
Create a docker-compose.yml for ShopLite with:

Services:
- PostgreSQL (orders database)
- MongoDB (inventory database)
- Zookeeper (Kafka dependency)
- Kafka (message broker with 3 topics: orders.placed, inventory.stock-reserved, inventory.stock-rejected)
- Keycloak (OIDC provider with realm auto-import)
- API Gateway (depends on Keycloak)
- Orders Service (depends on PostgreSQL, Kafka, Keycloak)
- Inventory Service (depends on MongoDB, Kafka, Keycloak)

Requirements:
- Health checks for all services
- Proper startup order (depends_on with conditions)
- Environment variables for connection strings
- Volume mounts for data persistence
- Network configuration
- Port mappings for external access
```

**Expected Output**: Production-ready docker-compose.yml

---

### 9. Integration Tests

**Prompt**:
```
Create integration tests for Orders Service in .NET 8 using:
- WebApplicationFactory for in-process testing
- Testcontainers for PostgreSQL and Kafka
- xUnit test framework

Test scenarios:
1. Create order with valid JWT → Returns 201 with orderId
2. Create order without JWT → Returns 401
3. Create order with insufficient scope → Returns 403
4. Get order by ID (customer sees own, admin sees any)
5. Order creation publishes OrderPlaced to outbox
6. Outbox dispatcher publishes events to Kafka
7. Consuming StockReserved updates order to CONFIRMED
8. Consuming StockRejected updates order to CANCELLED
9. Idempotency: Duplicate StockReserved doesn't double-update

Include setup/teardown for containers, database migrations, and test data seeding.
```

**Expected Output**: Comprehensive integration test suite

---

### 10. Health Check Endpoints

**Prompt**:
```
Implement health check endpoints for all services in .NET 8:

Requirements:
- GET /_health returns JSON with status and dependency checks
- Check PostgreSQL connection (Orders Service)
- Check MongoDB connection (Inventory Service)
- Check Kafka broker connectivity
- Check Keycloak OIDC discovery endpoint
- Include response time for each check
- Return 200 OK if all healthy, 503 Service Unavailable if any unhealthy
- Use AspNetCore.Diagnostics.HealthChecks library
- Structured logging for health check failures

Response format:
{
  "status": "healthy",
  "timestamp": "ISO-8601",
  "checks": {
    "database": {"status": "healthy", "responseTime": "5ms"},
    "messageBroker": {"status": "healthy", "responseTime": "12ms"}
  }
}
```

**Expected Output**: Complete health check implementation for all services

---

### 11. Structured Logging Configuration

**Prompt**:
```
Configure structured logging in .NET 8 with Serilog:
- JSON output format
- Include traceId, correlationId, orderId, customerId in log context
- Different log levels: Development (Debug), Production (Information)
- Log sinks: Console (structured JSON), File (rolling)
- Enrich logs with machine name, environment, timestamp
- Filter out sensitive data (passwords, tokens)
- Log HTTP requests/responses (excluding Authorization header)
- Integration with distributed tracing (Activity/DiagnosticSource)

Example log entry:
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "Information",
  "service": "orders-service",
  "traceId": "trace-123",
  "message": "Order created successfully",
  "context": {"orderId": "order-789", "customerId": "user-456"}
}
```

**Expected Output**: Complete Serilog configuration with structured logging

---

### 12. Keycloak Realm Configuration

**Prompt**:
```
Create a Keycloak realm export JSON for ShopLite:

Realm: shoplite

Clients:
- shoplite-api (confidential, service account enabled)
- shoplite-web (public, for frontend)

Roles:
- customer (default role)
- admin

Client Scopes:
- orders.read
- orders.write
- inventory.read
- inventory.write

Users:
- customer (username: customer, password: customer, role: customer, scopes: orders.read, orders.write)
- admin (username: admin, password: admin, role: admin, scopes: all)

Token settings:
- Access token lifespan: 5 minutes
- Refresh token lifespan: 30 minutes
- Include roles and scopes in token claims

Provide realm export JSON that can be imported on Keycloak startup.
```

**Expected Output**: Keycloak realm JSON configuration file

---

## Repository Layout

```
shoplite/
├── gateway/
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Services/
│   │   └── Program.cs
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── README.md
│
├── orders-service/
│   ├── src/
│   │   ├── Domain/
│   │   │   ├── Entities/
│   │   │   │   ├── Order.cs
│   │   │   │   └── OrderItem.cs
│   │   │   ├── ValueObjects/
│   │   │   │   ├── OrderId.cs
│   │   │   │   ├── CustomerId.cs
│   │   │   │   └── SKU.cs
│   │   │   ├── Events/
│   │   │   │   ├── OrderPlacedEvent.cs
│   │   │   │   ├── OrderConfirmedEvent.cs
│   │   │   │   └── OrderCancelledEvent.cs
│   │   │   └── Interfaces/
│   │   │       ├── IOrderRepository.cs
│   │   │       └── IUnitOfWork.cs
│   │   ├── Application/
│   │   │   ├── UseCases/
│   │   │   │   ├── CreateOrder/
│   │   │   │   │   ├── CreateOrderUseCase.cs
│   │   │   │   │   ├── CreateOrderRequest.cs
│   │   │   │   │   └── CreateOrderValidator.cs
│   │   │   │   ├── GetOrder/
│   │   │   │   ├── ConfirmOrder/
│   │   │   │   └── CancelOrder/
│   │   │   ├── Ports/
│   │   │   │   ├── IEventPublisher.cs
│   │   │   │   └── IOutboxDispatcher.cs
│   │   │   └── DTOs/
│   │   │       ├── OrderResponse.cs
│   │   │       └── OrderItemDto.cs
│   │   ├── Infrastructure/
│   │   │   ├── Persistence/
│   │   │   │   ├── OrdersDbContext.cs
│   │   │   │   ├── OrderRepository.cs
│   │   │   │   ├── OutboxRepository.cs
│   │   │   │   └── Migrations/
│   │   │   ├── Messaging/
│   │   │   │   ├── KafkaEventPublisher.cs
│   │   │   │   ├── OutboxDispatcher.cs
│   │   │   │   └── EventConsumers/
│   │   │   │       ├── StockReservedConsumer.cs
│   │   │   │       └── StockRejectedConsumer.cs
│   │   │   └── Auth/
│   │   │       ├── JwtValidator.cs
│   │   │       └── ScopeAuthorizationHandler.cs
│   │   ├── Presentation/
│   │   │   ├── Controllers/
│   │   │   │   └── OrdersController.cs
│   │   │   ├── Middleware/
│   │   │   │   ├── ExceptionHandlingMiddleware.cs
│   │   │   │   └── CorrelationIdMiddleware.cs
│   │   │   ├── Contracts/
│   │   │   │   ├── CreateOrderRequest.cs
│   │   │   │   └── OrderResponse.cs
│   │   │   └── Program.cs
│   │   └── appsettings.json
│   ├── tests/
│   │   ├── Domain.Tests/
│   │   │   ├── OrderTests.cs
│   │   │   └── OrderItemTests.cs
│   │   ├── Application.Tests/
│   │   │   └── CreateOrderUseCaseTests.cs
│   │   └── Integration.Tests/
│   │       ├── OrdersControllerTests.cs
│   │       ├── OutboxDispatcherTests.cs
│   │       └── TestFixtures/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── README.md
│
├── inventory-service/
│   ├── src/
│   │   ├── Domain/
│   │   │   ├── Entities/
│   │   │   │   └── Product.cs
│   │   │   ├── ValueObjects/
│   │   │   │   ├── SKU.cs
│   │   │   │   └── StockLevel.cs
│   │   │   ├── Events/
│   │   │   │   ├── StockReservedEvent.cs
│   │   │   │   └── StockRejectedEvent.cs
│   │   │   └── Interfaces/
│   │   │       └── IProductRepository.cs
│   │   ├── Application/
│   │   │   ├── UseCases/
│   │   │   │   ├── ReserveStock/
│   │   │   │   ├── AdjustStock/
│   │   │   │   └── GetProduct/
│   │   │   └── Ports/
│   │   │       └── IEventPublisher.cs
│   │   ├── Infrastructure/
│   │   │   ├── Persistence/
│   │   │   │   ├── MongoDbContext.cs
│   │   │   │   └── ProductRepository.cs
│   │   │   ├── Messaging/
│   │   │   │   ├── KafkaEventPublisher.cs
│   │   │   │   └── EventConsumers/
│   │   │   │       └── OrderPlacedConsumer.cs
│   │   │   └── Auth/
│   │   │       └── JwtValidator.cs
│   │   ├── Presentation/
│   │   │   ├── Controllers/
│   │   │   │   └── InventoryController.cs
│   │   │   └── Program.cs
│   │   └── appsettings.json
│   ├── tests/
│   │   ├── Domain.Tests/
│   │   ├── Application.Tests/
│   │   └── Integration.Tests/
│   ├── Dockerfile
│   └── README.md
│
├── contracts/
│   ├── events/
│   │   ├── OrderPlaced.v1.schema.json
│   │   ├── StockReserved.v1.schema.json
│   │   ├── StockRejected.v1.schema.json
│   │   ├── OrderConfirmed.v1.schema.json
│   │   └── OrderCancelled.v1.schema.json
│   └── README.md
│
├── ops/
│   ├── docker-compose.yml
│   ├── keycloak-realm.json
│   ├── postgres-init.sql
│   ├── kafka-topics.sh
│   └── README.md
│
├── tests/
│   ├── e2e/
│   │   ├── happy-path.test.js
│   │   └── insufficient-stock.test.js
│   └── postman/
│       ├── ShopLite.postman_collection.json
│       └── ShopLite.postman_environment.json
│
├── docs/
│   ├── architecture/
│   │   ├── c4-context.puml
│   │   ├── c4-context.png
│   │   ├── c4-container.puml
│   │   ├── c4-container.png
│   │   ├── sequence-order-saga.puml
│   │   └── sequence-order-saga.png
│   ├── decisions/
│   │   ├── 001-choreography-vs-orchestration.md
│   │   ├── 002-outbox-pattern-implementation.md
│   │   └── 003-polyglot-persistence-rationale.md
│   └── images/
│       └── dependency-diagram.png
│
├── .gitignore
├── README.md
├── PROMPTS.md          # ⚠️ MANDATORY: AI prompt log
└── LICENSE
```

### Key Directory Descriptions

**`/gateway`**: API Gateway service (BFF pattern)
- JWT validation
- Request routing
- Scope/role enforcement

**`/orders-service`**: Orders microservice (PostgreSQL + Clean Architecture)
- Creates orders
- Publishes OrderPlaced via outbox
- Consumes StockReserved/StockRejected

**`/inventory-service`**: Inventory microservice (MongoDB + Clean Architecture)
- Manages product stock
- Consumes OrderPlaced
- Publishes StockReserved/StockRejected

**`/contracts`**: Shared event contracts (JSON schemas)
- Version-controlled event definitions
- Schema validation files

**`/ops`**: Deployment and operations
- Docker Compose configuration
- Keycloak realm setup
- Database initialization scripts

**`/tests`**: Cross-service tests
- End-to-end scenarios
- Postman collections

**`/docs`**: Architecture documentation
- C4 diagrams
- Sequence diagrams
- Architecture Decision Records (ADRs)

**`PROMPTS.md`**: AI usage log (mandatory deliverable)

---

## Grader's Checklist

Use this checklist to verify all requirements before submission. Copy into your PR template or use as final review.

### Infrastructure & Operations (10 points)
- [ ] `docker-compose up` boots broker, DBs, OIDC, and all services without errors
- [ ] All services become healthy within 2 minutes
- [ ] Health check endpoints respond correctly for each service
- [ ] Logs are structured (JSON) and include traceId/correlationId
- [ ] Basic metrics are exposed (request count, duration, errors)

### Authentication & Authorization (15 points)
- [ ] JWT tokens can be minted (script/documentation provided)
- [ ] Customer token has `orders.read`, `orders.write` scopes
- [ ] Admin token has all scopes including `inventory.write`
- [ ] Roles are correctly enforced (customer sees own orders; admin sees all)
- [ ] Invalid/expired tokens return 401 Unauthorized
- [ ] Insufficient scopes return 403 Forbidden
- [ ] JWKS caching is implemented with refresh strategy

### Functional Happy Path (20 points)
- [ ] Customer can create order with valid token → Returns 201 with orderId
- [ ] Order initially has status `PENDING`
- [ ] OrderPlaced event written to outbox table
- [ ] Outbox dispatcher publishes event to Kafka
- [ ] Inventory service consumes OrderPlaced
- [ ] Stock is reserved atomically (available decrements, reserved increments)
- [ ] StockReserved event published to Kafka
- [ ] Orders service consumes StockReserved
- [ ] Order status updates to `CONFIRMED`
- [ ] Customer can retrieve order and see CONFIRMED status

### Functional Unhappy Path (15 points)
- [ ] Create order with SKU that has insufficient stock
- [ ] Inventory service detects insufficient stock
- [ ] StockRejected event published with reason and details
- [ ] Orders service consumes StockRejected
- [ ] Order status updates to `CANCELLED`
- [ ] Stock levels remain unchanged

### Idempotency & Reliability (10 points)
- [ ] Duplicate OrderPlaced events don't create duplicate reservations
- [ ] Duplicate StockReserved events don't double-update order status
- [ ] Event consumers track processed event IDs
- [ ] Failed event processing retries with backoff
- [ ] After max retries, messages go to Dead Letter Queue
- [ ] DLQ messages logged with context and error details

### Clean Architecture (25 points)
- [ ] Domain, Application, Infrastructure, Presentation layers clearly separated
- [ ] Dependency rule enforced (no Infrastructure references from Domain)
- [ ] Domain layer has zero framework dependencies
- [ ] Repository interfaces defined in Domain, implemented in Infrastructure
- [ ] Use cases orchestrate business logic in Application layer
- [ ] Controllers are thin (delegate to use cases)
- [ ] Dependency injection properly configured
- [ ] Dependency diagram provided and accurate
- [ ] Any deviations from Clean Architecture documented

### Event-Driven Design (20 points)
- [ ] Outbox pattern implemented for Orders Service
- [ ] Transactional consistency between order creation and outbox write
- [ ] Background dispatcher reliably publishes outbox events
- [ ] All events include version, traceId, correlationId, timestamp
- [ ] Event schemas documented (JSON Schema files)
- [ ] At-least-once delivery semantics implemented
- [ ] Consumers manually commit offsets after successful processing
- [ ] Clear choreography pattern (no orchestrator)

### Database Design (15 points)
- [ ] PostgreSQL schema normalized appropriately
- [ ] Indexes on customer_id, status, and outbox.processed_at
- [ ] Database migrations implemented and version-controlled
- [ ] Optimistic locking on orders table (version field)
- [ ] MongoDB schema appropriate for inventory
- [ ] Indexes on sku (unique) and available fields
- [ ] Optimistic concurrency for stock updates (using updatedAt)

### Code Quality & Tests (15 points)
- [ ] Unit tests for domain entities and value objects
- [ ] Unit tests for use cases
- [ ] >80% code coverage for Domain and Application layers
- [ ] Integration tests with Testcontainers (PostgreSQL, MongoDB, Kafka)
- [ ] Event contract serialization tests
- [ ] End-to-end tests for happy and unhappy paths
- [ ] Tests are readable and follow AAA pattern
- [ ] All tests pass consistently

### Documentation (10 points)
- [ ] README.md with architecture overview
- [ ] Clear "How to Run" instructions
- [ ] "How to Test" instructions with example commands
- [ ] Known limitations documented
- [ ] Next steps outlined
- [ ] C4 Context diagram present
- [ ] C4 Container diagram present
- [ ] Sequence diagram for order saga present
- [ ] Diagrams are clear and accurate

### AI Usage & Transparency (MANDATORY)
- [ ] PROMPTS.md file present with detailed prompt log
- [ ] Each prompt includes: tool name, context, timestamp, prompt text, result summary, manual edits
- [ ] AI-generated commits marked with `AI:` prefix
- [ ] AI usage percentage documented in README (≥70% required)
- [ ] Manual edits clearly documented
- [ ] Code review shows understanding (not blind copy-paste)

### Bonus Points (Up to +30)
- [ ] **Well-Reasoned Assumptions (+10)**: Clear documentation of ambiguities and thoughtful decisions with rationale
- [ ] **Architecture Decision Records (+5)**: ADRs for major technical decisions
- [ ] **Additional Features (+10)**: Read model/CQRS, advanced monitoring, performance optimizations
- [ ] **Exceptional Documentation (+5)**: Video walkthrough, comprehensive guides, excellent diagrams
- [ ] **Production Readiness (+10)**: Circuit breakers, rate limiting, advanced security

### Final Checks
- [ ] All code compiles without errors or warnings
- [ ] No secrets or credentials committed to repository
- [ ] .gitignore properly configured
- [ ] Docker images build successfully
- [ ] No TODO comments without tracking
- [ ] Code follows consistent style guidelines
- [ ] Ready for 30-minute technical interview

---

## Submission Guidelines

### What to Submit

1. **Git Repository** (GitHub, GitLab, or Bitbucket)
   - Public repository OR provide access to reviewers
   - Clean commit history with descriptive messages
   - AI-generated commits marked with `AI:` prefix

2. **Required Files**:
   - ✅ **README.md** - Main documentation
   - ✅ **PROMPTS.md** - AI prompt log (MANDATORY)
   - ✅ **docker-compose.yml** - One-command setup
   - ✅ Diagrams (C4 Context, C4 Container, Sequence diagram)
   - ✅ Postman collection OR cURL script examples
   - ✅ Source code for all services (gateway, orders, inventory)
   - ✅ Tests (unit, integration, E2E)

3. **Optional but Recommended**:
   - 📹 **Video Walkthrough** (≤5 minutes)
     - Quick architecture overview
     - Demo of happy path (create order → stock reserved → order confirmed)
     - Demo of unhappy path (insufficient stock → order cancelled)
     - Code structure walkthrough
     - Tool: Loom, OBS Studio, QuickTime, or similar

### README.md Structure

Your README.md should include:

```markdown
# ShopLite - Event-Driven Microservices

⚠️ **AI Usage Declaration**: This project was developed with ~XX% AI-generated code using ChatGPT-4, GitHub Copilot, and Cursor. See PROMPTS.md for detailed log.

## Overview
[Brief description of the project]

## Architecture
[Link to diagrams, high-level explanation]

### Clean Architecture
[Explanation of layer separation, dependency diagram]

### Event Flow
[Choreography explanation, reference to sequence diagram]

## Technology Stack
- .NET 8 / Node.js 18
- PostgreSQL 15
- MongoDB 6
- Apache Kafka 3.x
- Keycloak 23.x
- Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker & Docker Compose
- [Any other requirements]

### Setup
```bash
# Clone and start
git clone <repo-url>
cd shoplite
docker-compose up -d

# Verify health
curl http://localhost:8080/_health
```

### Testing

**Happy Path**:
```bash
# [cURL commands or Postman collection reference]
```

**Unhappy Path**:
```bash
# [cURL commands for insufficient stock scenario]
```

**Run Tests**:
```bash
dotnet test
# OR
npm test
```

## API Documentation
[Link to Swagger/OpenAPI or Postman collection]

## Health Checks
- Gateway: http://localhost:8080/_health
- Orders Service: http://localhost:5001/_health
- Inventory Service: http://localhost:5002/_health

## Trade-offs & Design Decisions
[Link to ADRs or inline explanations]

## Known Limitations
- [Limitation 1]
- [Limitation 2]

## Next Steps / Future Improvements
- [ ] Implement event sourcing
- [ ] Add CQRS read models
- [ ] Kubernetes deployment
- [ ] Observability with OpenTelemetry

## AI Usage (≥70%)
- Architecture setup: 80% AI-generated
- Outbox pattern: 90% AI-generated
- Kafka consumers: 85% AI-generated
- Tests: 70% AI-generated
- Manual work: Architecture decisions, business logic refinement, debugging

See PROMPTS.md for detailed prompt log.

## License
[License information]
```

### PROMPTS.md Structure

**MANDATORY**: Log every AI interaction

```markdown
# AI Prompt Log - ShopLite Project

**Total AI Usage**: ~XX% of codebase
**AI Tools Used**: ChatGPT-4, GitHub Copilot, Cursor, Claude

---

## Prompt #1: Clean Architecture Setup

**Tool**: ChatGPT-4
**Context**: Initial project structure setup
**Timestamp**: 2025-01-15 09:00:00

**Prompt**:
```
Generate a Clean Architecture folder structure for a .NET 8 microservice named Orders...
[Full prompt text]
```

**Result Summary**:
Generated complete folder structure with example files for Domain, Application, Infrastructure, and Presentation layers.

**Manual Edits**:
- Adjusted namespace conventions to match company standards
- Added additional value objects for CustomerId and SKU
- Modified DI registration to use custom extension methods

**Outcome**: Accepted with modifications (~80% AI-generated)

**Files Affected**:
- `orders-service/src/Domain/*`
- `orders-service/src/Application/*`
- `orders-service/src/Program.cs`

---

## Prompt #2: Outbox Pattern Implementation

**Tool**: GitHub Copilot
**Context**: Infrastructure layer - reliable event publishing
**Timestamp**: 2025-01-15 10:30:00

**Prompt**:
```
In .NET 8 with EF Core and Postgres, implement an Outbox pattern...
[Full prompt text]
```

**Result Summary**: [Summary]

**Manual Edits**: [Edits]

**Outcome**: [Accepted/Modified/Rejected] (XX% AI-generated)

**Files Affected**: [List]

---

[Continue for ALL prompts...]

## Summary Statistics

| Category | Prompts Used | AI-Generated % |
|----------|--------------|----------------|
| Architecture Setup | 5 | 85% |
| Domain Layer | 8 | 70% |
| Infrastructure | 12 | 90% |
| Tests | 10 | 75% |
| Documentation | 4 | 80% |
| **Total** | **39** | **~XX%** |
```

### Video Walkthrough (Optional but Recommended)

**Duration**: ≤5 minutes

**Structure**:
1. **Introduction (30 seconds)**
   - Your name
   - Brief project overview
   - Tech stack

2. **Architecture Overview (1 minute)**
   - Show C4 diagrams
   - Explain Clean Architecture layers
   - Event-driven choreography explanation

3. **Live Demo (2 minutes)**
   - `docker-compose up` → Show all services starting
   - Create order (happy path) → Show order CONFIRMED
   - Create order with insufficient stock → Show order CANCELLED
   - Check logs showing traceId/correlationId

4. **Code Walkthrough (1 minute)**
   - Show folder structure
   - Highlight outbox pattern implementation
   - Show event consumer with idempotency

5. **Testing & AI Usage (30 seconds)**
   - Run test suite
   - Briefly show PROMPTS.md
   - Mention AI usage percentage

**Tools**: Loom, OBS Studio, QuickTime Screen Recording, or Zoom

**Upload**: YouTube (unlisted) or Loom, include link in README

### Submission Checklist

Before submitting, verify:

- [ ] Repository is accessible (public or access granted)
- [ ] README.md is comprehensive and well-formatted
- [ ] PROMPTS.md contains ALL AI prompts with detailed logs
- [ ] AI usage ≥70% documented honestly
- [ ] All diagrams present (C4 Context, Container, Sequence)
- [ ] `docker-compose up` works on fresh clone
- [ ] All tests pass (`dotnet test` or `npm test`)
- [ ] No secrets or credentials in repository
- [ ] Postman collection or cURL examples provided
- [ ] Known limitations documented
- [ ] Commit messages are descriptive
- [ ] AI-generated commits marked with `AI:` prefix
- [ ] Video walkthrough uploaded (optional but recommended)
- [ ] Code compiles without warnings
- [ ] Grader's checklist items verified

### How to Submit

**Email** your submission to: [recruiter-email@company.com]

**Subject**: ShopLite Coding Test Submission - [Your Name]

**Body**:
```
Hi [Recruiter Name],

Please find my ShopLite coding test submission:

Repository: [GitHub URL]
Video Walkthrough: [Loom/YouTube URL] (optional)
AI Usage: ~XX% (see PROMPTS.md for details)
Development Time: ~XX hours

Key highlights:
- Clean Architecture with strict layer separation
- Event-driven choreography with outbox pattern
- OAuth2/OIDC security with Keycloak
- >80% test coverage
- One-command Docker Compose setup

I'm ready for the 30-minute technical review at your convenience.

Best regards,
[Your Name]
```

### Post-Submission: Technical Review (30 minutes)

Be prepared to discuss:

1. **Architecture Decisions**
   - Why choreography over orchestration?
   - How would you handle compensating transactions?
   - What would change at higher scale?

2. **Pattern Explanations**
   - Explain the outbox pattern implementation
   - How does idempotency work in your consumers?
   - Why optimistic concurrency for inventory?

3. **Live Coding**
   - Extend a function (e.g., add order cancellation endpoint)
   - Debug a failure scenario
   - Add a new event type

4. **Evolution Scenarios**
   - How would you add a new service (e.g., Notifications)?
   - How to handle event schema changes?
   - Migration strategy to event sourcing

5. **AI Usage Discussion**
   - How did AI help/hinder?
   - What did you learn?
   - What would you do differently?

---

## Appendix

### Glossary

- **Outbox Pattern**: Transactional pattern for reliable event publishing
- **Choreography**: Event-driven coordination where services react to events
- **Orchestration**: Centralized coordination with saga coordinator
- **Idempotency**: Ability to safely retry operations without side effects
- **JWKS**: JSON Web Key Set for JWT signature verification
- **DLQ**: Dead Letter Queue for failed messages
- **Clean Architecture**: Architectural pattern with strict layer separation
- **CQRS**: Command Query Responsibility Segregation

### References

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Outbox Pattern - Microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)
- [Saga Pattern - Microservices.io](https://microservices.io/patterns/data/saga.html)
- [OAuth2/OIDC Specification](https://oauth.net/2/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)

### Success Metrics

**Project Complete When**:
- [ ] All acceptance criteria met
- [ ] Score ≥85/100 on evaluation rubric
- [ ] AI usage ≥70% documented in PROMPTS.md
- [ ] One-command setup works
- [ ] Happy and unhappy paths tested
- [ ] Documentation comprehensive
- [ ] Ready for 30-minute technical review

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: Software Development Team Lead Candidate
