#!/bin/bash
# ShopLite Test Scenarios

set -e

echo "🧪 ShopLite Test Scenarios"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8180}"

echo "📍 Gateway URL: $GATEWAY_URL"
echo "🔐 Keycloak URL: $KEYCLOAK_URL"
echo ""

# Function to get access token
get_token() {
    local username=$1
    local password=$2

    echo "🔑 Getting token for user: $username"

    TOKEN_RESPONSE=$(curl -s -X POST \
        "$KEYCLOAK_URL/realms/shoplite/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=$username" \
        -d "password=$password" \
        -d "grant_type=password" \
        -d "client_id=shoplite-api" \
        -d "client_secret=shoplite-secret")

    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}❌ Failed to get token${NC}"
        echo "Response: $TOKEN_RESPONSE"
        exit 1
    fi

    echo -e "${GREEN}✅ Token obtained${NC}"
    echo ""
}

# Test 1: Get Admin Token
echo "=== Test 1: Get Admin Token ==="
get_token "admin" "admin"
ADMIN_TOKEN="$ACCESS_TOKEN"

# Test 2: Seed Inventory
echo "=== Test 2: Seed Inventory (Admin) ==="
echo "Adding product ABC with 100 units..."

SEED_RESPONSE=$(curl -s -X POST \
    "$GATEWAY_URL/inventory/adjust" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"sku":"ABC","delta":100}')

echo "Response: $SEED_RESPONSE"

if echo "$SEED_RESPONSE" | grep -q '"sku"'; then
    echo -e "${GREEN}✅ Inventory seeded successfully${NC}"
else
    echo -e "${RED}❌ Failed to seed inventory${NC}"
fi
echo ""

# Test 3: Get Customer Token
echo "=== Test 3: Get Customer Token ==="
get_token "customer" "customer"
CUSTOMER_TOKEN="$ACCESS_TOKEN"

# Test 4: Happy Path - Create Order with Available Stock
echo "=== Test 4: Happy Path - Create Order ==="
echo "Creating order for 2x ABC..."

ORDER_RESPONSE=$(curl -s -X POST \
    "$GATEWAY_URL/orders" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "items": [
            {"sku": "ABC", "qty": 2}
        ]
    }')

echo "Response: $ORDER_RESPONSE"

ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
    echo -e "${GREEN}✅ Order created: $ORDER_ID${NC}"
    echo ""

    # Wait for async processing
    echo "⏳ Waiting 3 seconds for event processing..."
    sleep 3

    # Check order status
    echo "📋 Checking order status..."
    ORDER_STATUS_RESPONSE=$(curl -s -X GET \
        "$GATEWAY_URL/orders/$ORDER_ID" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN")

    echo "Order details: $ORDER_STATUS_RESPONSE"

    if echo "$ORDER_STATUS_RESPONSE" | grep -q '"status":"CONFIRMED"'; then
        echo -e "${GREEN}✅ Order CONFIRMED (Happy path success!)${NC}"
    elif echo "$ORDER_STATUS_RESPONSE" | grep -q '"status":"PENDING"'; then
        echo -e "${YELLOW}⚠️  Order still PENDING (may need more time)${NC}"
    else
        echo -e "${RED}❌ Unexpected order status${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create order${NC}"
fi
echo ""

# Test 5: Unhappy Path - Insufficient Stock
echo "=== Test 5: Unhappy Path - Insufficient Stock ==="
echo "Creating order for 200x ABC (should fail)..."

ORDER_RESPONSE_2=$(curl -s -X POST \
    "$GATEWAY_URL/orders" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "items": [
            {"sku": "ABC", "qty": 200}
        ]
    }')

echo "Response: $ORDER_RESPONSE_2"

ORDER_ID_2=$(echo "$ORDER_RESPONSE_2" | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID_2" ]; then
    echo -e "${GREEN}✅ Order created: $ORDER_ID_2${NC}"
    echo ""

    # Wait for async processing
    echo "⏳ Waiting 3 seconds for event processing..."
    sleep 3

    # Check order status
    echo "📋 Checking order status..."
    ORDER_STATUS_RESPONSE_2=$(curl -s -X GET \
        "$GATEWAY_URL/orders/$ORDER_ID_2" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN")

    echo "Order details: $ORDER_STATUS_RESPONSE_2"

    if echo "$ORDER_STATUS_RESPONSE_2" | grep -q '"status":"CANCELLED"'; then
        echo -e "${GREEN}✅ Order CANCELLED (Unhappy path success!)${NC}"
    elif echo "$ORDER_STATUS_RESPONSE_2" | grep -q '"status":"PENDING"'; then
        echo -e "${YELLOW}⚠️  Order still PENDING (may need more time)${NC}"
    else
        echo -e "${RED}❌ Unexpected order status${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create order${NC}"
fi
echo ""

# Test 6: Unauthorized Access
echo "=== Test 6: Unauthorized Access Test ==="
echo "Trying to create order without token..."

UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
    "$GATEWAY_URL/orders" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"sku":"ABC","qty":1}]}')

HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ Correctly returned 401 Unauthorized${NC}"
else
    echo -e "${RED}❌ Expected 401, got $HTTP_CODE${NC}"
fi
echo ""

# Test 7: Forbidden Access (Customer accessing admin endpoint)
echo "=== Test 7: Forbidden Access Test ==="
echo "Customer trying to adjust inventory (admin only)..."

FORBIDDEN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
    "$GATEWAY_URL/inventory/adjust" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"sku":"ABC","delta":10}')

HTTP_CODE=$(echo "$FORBIDDEN_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$HTTP_CODE" == "403" ]; then
    echo -e "${GREEN}✅ Correctly returned 403 Forbidden${NC}"
else
    echo -e "${RED}❌ Expected 403, got $HTTP_CODE${NC}"
fi
echo ""

echo "=========================="
echo "✨ Test scenarios completed!"
echo "=========================="
