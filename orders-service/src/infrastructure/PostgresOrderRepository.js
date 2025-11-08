// Infrastructure Layer: PostgreSQL Repository Implementation
const { Pool } = require('pg');
const Order = require('../domain/Order');

class PostgresOrderRepository {
  constructor({ pool, logger }) {
    this.pool = pool;
    this.logger = logger;
  }

  async createWithOutbox(order, eventPayload) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert order
      await client.query(
        `INSERT INTO orders (id, customer_id, status, created_at, updated_at, version)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, order.customerId, order.status, order.createdAt, order.updatedAt, order.version]
      );

      // Insert order items
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        await client.query(
          `INSERT INTO order_items (order_id, line_no, sku, qty)
           VALUES ($1, $2, $3, $4)`,
          [order.id, i + 1, item.sku, item.qty]
        );
      }

      // Insert outbox event (transactional)
      await client.query(
        `INSERT INTO outbox (aggregate_id, type, payload, created_at)
         VALUES ($1, $2, $3, $4)`,
        [order.id, eventPayload.type, JSON.stringify(eventPayload.payload), new Date()]
      );

      await client.query('COMMIT');

      this.logger.info({
        message: 'Order and outbox event created',
        orderId: order.id
      });

      return order.id;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error({
        message: 'Failed to create order with outbox',
        error: error.message,
        orderId: order.id
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(orderId) {
    try {
      const orderResult = await this.pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return null;
      }

      const itemsResult = await this.pool.query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY line_no',
        [orderId]
      );

      const orderRow = orderResult.rows[0];
      return new Order({
        id: orderRow.id,
        customerId: orderRow.customer_id,
        status: orderRow.status,
        items: itemsResult.rows.map(item => ({
          sku: item.sku,
          qty: item.qty
        })),
        createdAt: orderRow.created_at,
        updatedAt: orderRow.updated_at,
        version: orderRow.version
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to find order',
        error: error.message,
        orderId
      });
      throw error;
    }
  }

  async update(order) {
    try {
      const result = await this.pool.query(
        `UPDATE orders
         SET status = $1, updated_at = $2, version = $3
         WHERE id = $4 AND version = $5`,
        [order.status, order.updatedAt, order.version, order.id, order.version - 1]
      );

      if (result.rowCount === 0) {
        throw new Error('Optimistic locking conflict or order not found');
      }

      this.logger.info({
        message: 'Order updated',
        orderId: order.id,
        status: order.status
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to update order',
        error: error.message,
        orderId: order.id
      });
      throw error;
    }
  }
}

module.exports = PostgresOrderRepository;
