-- Orders Service Database Schema
-- PostgreSQL

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 0
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    PRIMARY KEY (order_id, line_no)
);

-- Outbox table for transactional event publishing
CREATE TABLE IF NOT EXISTS outbox (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku);

CREATE INDEX IF NOT EXISTS idx_outbox_processed_at
    ON outbox(processed_at)
    WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON outbox(created_at);

-- Comments for documentation
COMMENT ON TABLE orders IS 'Customer orders with PENDING, CONFIRMED, or CANCELLED status';
COMMENT ON TABLE order_items IS 'Line items for each order';
COMMENT ON TABLE outbox IS 'Transactional outbox for reliable event publishing';
COMMENT ON COLUMN orders.version IS 'Optimistic locking version number';
COMMENT ON COLUMN outbox.processed_at IS 'NULL = pending, timestamp = published';
