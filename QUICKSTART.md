# ShopLite - Quick Start Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ installed
- Terminal/bash access

## Step 1: Start Infrastructure (2 minutes)

```bash
cd ops
docker-compose up -d

# Wait for all services to be healthy
watch -n 2 'docker-compose ps'

# You should see:
# - shoplite-postgres: healthy
# - shoplite-mongo: healthy
# - shoplite-kafka: healthy
# - shoplite-keycloak: healthy
```

## Step 2: Install Dependencies

```bash
# In separate terminal windows or tabs:

# Terminal 1 - Orders Service
cd orders-service
npm install

# Terminal 2 - Inventory Service
cd inventory-service
npm install

# Terminal 3 - Gateway
cd gateway
npm install
```

## Step 3: Start Services

```bash
# Terminal 1 - Orders Service (port 5001)
cd orders-service
npm start

# Terminal 2 - Inventory Service (port 5002)
cd inventory-service
npm start

# Terminal 3 - Gateway (port 8080)
cd gateway
npm start
```

## Step 4: Run Tests

```bash
# In a new terminal
cd tests
./test-scenarios.sh
```

## Expected Output

```
🧪 ShopLite Test Scenarios
==========================

📍 Gateway URL: http://localhost:8080
🔐 Keycloak URL: http://localhost:8180

=== Test 1: Get Admin Token ===
🔑 Getting token for user: admin
✅ Token obtained

=== Test 2: Seed Inventory (Admin) ===
Adding product ABC with 100 units...
✅ Inventory seeded successfully

=== Test 3: Get Customer Token ===
🔑 Getting token for user: customer
✅ Token obtained

=== Test 4: Happy Path - Create Order ===
Creating order for 2x ABC...
✅ Order created: 550e8400-e29b-41d4-a716-446655440000
⏳ Waiting 3 seconds for event processing...
📋 Checking order status...
✅ Order CONFIRMED (Happy path success!)

=== Test 5: Unhappy Path - Insufficient Stock ===
Creating order for 200x ABC (should fail)...
✅ Order created: 660e8400-e29b-41d4-a716-446655440001
⏳ Waiting 3 seconds for event processing...
📋 Checking order status...
✅ Order CANCELLED (Unhappy path success!)

=== Test 6: Unauthorized Access Test ===
✅ Correctly returned 401 Unauthorized

=== Test 7: Forbidden Access Test ===
✅ Correctly returned 403 Forbidden

==========================
✨ Test scenarios completed!
==========================
```

## Manual Testing with cURL

### Get Admin Token

```bash
curl -X POST http://localhost:8180/realms/shoplite/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=shoplite-api" \
  -d "client_secret=shoplite-secret" | jq

# Save the access_token
export ADMIN_TOKEN="<paste-token-here>"
```

### Get Customer Token

```bash
curl -X POST http://localhost:8180/realms/shoplite/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=customer" \
  -d "password=customer" \
  -d "grant_type=password" \
  -d "client_id=shoplite-api" \
  -d "client_secret=shoplite-secret" | jq

# Save the access_token
export CUSTOMER_TOKEN="<paste-token-here>"
```

### Add Inventory (Admin)

```bash
curl -X POST http://localhost:8080/inventory/adjust \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"ABC","delta":100}' | jq
```

### Create Order (Customer)

```bash
curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sku": "ABC", "qty": 2}
    ]
  }' | jq

# Save the orderId
export ORDER_ID="<paste-order-id>"
```

### Check Order Status

```bash
curl -X GET http://localhost:8080/orders/$ORDER_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq
```

### Health Checks

```bash
curl http://localhost:8080/_health | jq      # Gateway
curl http://localhost:5001/_health | jq      # Orders Service
curl http://localhost:5002/_health | jq      # Inventory Service
```

## Troubleshooting

### Services won't start

**Check if ports are in use**:
```bash
lsof -i :5001  # Orders Service
lsof -i :5002  # Inventory Service
lsof -i :8080  # Gateway
lsof -i :5432  # PostgreSQL
lsof -i :27017 # MongoDB
lsof -i :9092  # Kafka
lsof -i :8180  # Keycloak
```

### Kafka connection errors

**Wait longer**: Kafka can take 60-90 seconds to fully start. Check:
```bash
docker-compose logs kafka
```

### Keycloak not responding

**Check Keycloak logs**:
```bash
docker-compose logs keycloak
```

**Access Keycloak admin console**:
- URL: http://localhost:8180
- Username: admin
- Password: admin

### Order stays PENDING

**Check logs**:
```bash
# Orders Service logs
cd orders-service && npm start  # Look for outbox dispatcher messages

# Inventory Service logs
cd inventory-service && npm start  # Look for OrderPlaced consumption

# Kafka topics
docker exec -it shoplite-kafka kafka-topics --list --bootstrap-server localhost:9092
docker exec -it shoplite-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders.placed \
  --from-beginning
```

### Database connection errors

**Reset databases**:
```bash
cd ops
docker-compose down -v  # WARNING: Deletes all data
docker-compose up -d
```

## Clean Up

```bash
# Stop all services
cd ops
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v
```

## Next Steps

1. Review the code in `orders-service/`, `inventory-service/`, `gateway/`
2. Check `spec.md` for detailed requirements
3. Review `PROMPTS.md` for AI usage documentation
4. Read `PROJECT_STATUS.md` for grading checklist
5. Prepare for 30-minute technical interview

## Support

For issues, check:
- `README.md` - Full documentation
- `spec.md` - Detailed specifications
- `PROJECT_STATUS.md` - Implementation status
- Docker logs: `docker-compose logs <service-name>`
