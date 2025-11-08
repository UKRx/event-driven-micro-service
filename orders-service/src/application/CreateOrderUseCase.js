// Application Layer: Use Case
// Orchestrates domain logic and infrastructure

const { v4: uuidv4 } = require('uuid');
const Order = require('../domain/Order');

class CreateOrderUseCase {
  constructor({ orderRepository, outboxRepository, logger }) {
    this.orderRepository = orderRepository;
    this.outboxRepository = outboxRepository;
    this.logger = logger;
  }

  async execute({ customerId, items, traceId, correlationId }) {
    try {
      // Create domain entity
      const order = new Order({
        id: uuidv4(),
        customerId,
        status: 'PENDING',
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0
      });

      // Transactional: Save order + outbox event
      const orderId = await this.orderRepository.createWithOutbox(order, {
        type: 'OrderPlaced',
        version: 1,
        payload: {
          type: 'OrderPlaced',
          version: 1,
          orderId: order.id,
          customerId: order.customerId,
          items: order.items,
          traceId: traceId || uuidv4(),
          correlationId: correlationId || uuidv4(),
          ts: new Date().toISOString()
        }
      });

      this.logger.info({
        message: 'Order created successfully',
        orderId,
        customerId,
        traceId,
        correlationId
      });

      return { orderId: order.id, status: order.status };
    } catch (error) {
      this.logger.error({
        message: 'Failed to create order',
        error: error.message,
        customerId,
        traceId,
        correlationId
      });
      throw error;
    }
  }
}

module.exports = CreateOrderUseCase;
