#!/bin/bash
# Health Check Tests for ShopLite Services

set -e

echo "🏥 ShopLite Health Check Tests"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
ORDERS_URL="${ORDERS_URL:-http://localhost:5001}"
INVENTORY_URL="${INVENTORY_URL:-http://localhost:5002}"

echo "Testing health endpoints..."
echo ""

# Test Gateway Health
echo -n "Gateway ($GATEWAY_URL/_health): "
if curl -f -s "$GATEWAY_URL/_health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
    exit 1
fi

# Test Orders Service Health
echo -n "Orders Service ($ORDERS_URL/_health): "
if curl -f -s "$ORDERS_URL/_health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
    exit 1
fi

# Test Inventory Service Health
echo -n "Inventory Service ($INVENTORY_URL/_health): "
if curl -f -s "$INVENTORY_URL/_health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
    exit 1
fi

echo ""
echo "==============================="
echo -e "${GREEN}✅ All services healthy!${NC}"
echo "==============================="
