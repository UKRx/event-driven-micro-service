# Postman Collection for ShopLite

This directory contains a Postman collection for manual testing of the ShopLite API.

---

## Import Collection

1. Open Postman
2. Click **Import** button
3. Select `ShopLite.postman_collection.json`
4. Collection will appear in your workspace

---

## Collection Variables

The collection includes pre-configured variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `gateway_url` | `http://localhost:8080` | API Gateway URL |
| `orders_url` | `http://localhost:5001` | Orders Service URL |
| `inventory_url` | `http://localhost:5002` | Inventory Service URL |
| `keycloak_url` | `http://localhost:8180` | Keycloak URL |
| `admin_token` | (auto-set) | Admin JWT token |
| `customer_token` | (auto-set) | Customer JWT token |
| `order_id` | (auto-set) | Last created order ID |

**Note**: Tokens are automatically saved when you run the "Get Admin Token" or "Get Customer Token" requests.

---

## Request Organization

### 1. Authentication
- **Get Admin Token** - Obtain JWT for admin user
- **Get Customer Token** - Obtain JWT for customer user

### 2. Orders
- **Create Order (Customer)** - Create new order with customer token
- **Get Order by ID (Customer)** - Retrieve order details
- **Create Order - Insufficient Stock** - Test unhappy path
- **Unauthorized - No Token** - Test 401 response

### 3. Inventory
- **Adjust Stock (Admin)** - Add/remove inventory (admin only)
- **Get Product (Admin)** - View product stock levels
- **Forbidden - Customer Adjusting Stock** - Test 403 response

### 4. Health Checks
- **Gateway Health** - Check gateway status
- **Orders Service Health** - Check orders service status
- **Inventory Service Health** - Check inventory service status

---

## Usage Flow

### Recommended Test Sequence:

1. **Start Infrastructure**
   ```bash
   cd ops && docker-compose up -d
   ```

2. **Start Services** (3 terminals)
   ```bash
   cd orders-service && npm start
   cd inventory-service && npm start
   cd gateway && npm start
   ```

3. **Run Postman Requests in Order**:

   **Step 1**: Get tokens
   - Run "Get Admin Token" → saves `{{admin_token}}`
   - Run "Get Customer Token" → saves `{{customer_token}}`

   **Step 2**: Seed inventory
   - Run "Adjust Stock (Admin)" → Adds 100 units of SKU "ABC"

   **Step 3**: Test happy path
   - Run "Create Order (Customer)" → Order created, saves `{{order_id}}`
   - Wait 3 seconds (for async processing)
   - Run "Get Order by ID" → Should show `status: "CONFIRMED"`

   **Step 4**: Test unhappy path
   - Run "Create Order - Insufficient Stock" → Order created
   - Wait 3 seconds
   - Manually GET the cancelled_order_id → Should show `status: "CANCELLED"`

   **Step 5**: Test authorization
   - Run "Unauthorized - No Token" → Should return 401
   - Run "Forbidden - Customer Adjusting Stock" → Should return 403

   **Step 6**: Verify health
   - Run all 3 health check requests → All should return 200 OK

---

## Tests Included

Each request includes **automatic tests** that run after the response:

**Example** (Create Order):
```javascript
pm.test('Order created', () => {
    pm.response.to.have.status(201);
    pm.expect(response.orderId).to.exist;
});
```

**View test results** in the "Test Results" tab after running each request.

---

## Running Collection with Newman (CLI)

You can run the entire collection from command line:

```bash
# Install Newman
npm install -g newman

# Run collection
newman run ShopLite.postman_collection.json
```

**Expected output**:
```
┌─────────────────────────┬────────────────────┬────────────────────┐
│                         │           executed │             failed │
├─────────────────────────┼────────────────────┼────────────────────┤
│              iterations │                  1 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│                requests │                 12 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│            test-scripts │                 12 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│      assertions │                 15 │                  0 │
└─────────────────────────┴────────────────────┴────────────────────┘
```

---

## Troubleshooting

### "Could not get any response"
**Cause**: Services not running

**Fix**:
```bash
# Check services are running
curl http://localhost:8080/_health
curl http://localhost:5001/_health
curl http://localhost:5002/_health
```

### "401 Unauthorized" on all requests
**Cause**: Token expired or not set

**Fix**:
1. Run "Get Admin Token" or "Get Customer Token" again
2. Check Collection Variables to see if token is set

### Order stays "PENDING" forever
**Cause**: Event processing not working

**Fix**:
1. Check Orders Service logs for outbox dispatcher
2. Check Inventory Service logs for event consumption
3. Verify Kafka is running: `docker ps | grep kafka`

---

## Sample Requests

### Create Order (cURL equivalent)
```bash
curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sku": "ABC", "qty": 2}
    ]
  }'
```

### Adjust Stock (cURL equivalent)
```bash
curl -X POST http://localhost:8080/inventory/adjust \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "ABC",
    "delta": 100
  }'
```

---

## References

- [Postman Learning Center](https://learning.postman.com/)
- [Newman CLI Documentation](https://www.npmjs.com/package/newman)
- [Main README](../../README.md)
- [Test Scenarios](../e2e/test-scenarios.sh)

---

**Last Updated**: 2025-11-08
**Collection Version**: 1.0
