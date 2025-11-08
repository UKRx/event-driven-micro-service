// Application Layer: Get Order Use Case

class GetOrderUseCase {
  constructor({ orderRepository, logger }) {
    this.orderRepository = orderRepository;
    this.logger = logger;
  }

  async execute({ orderId, requestingCustomerId, isAdmin }) {
    try {
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      // Authorization: customer can only see own orders, admin sees all
      if (!isAdmin && order.customerId !== requestingCustomerId) {
        throw new Error('Forbidden: Cannot access this order');
      }

      this.logger.info({
        message: 'Order retrieved',
        orderId,
        requestingCustomerId
      });

      return order;
    } catch (error) {
      this.logger.error({
        message: 'Failed to get order',
        error: error.message,
        orderId,
        requestingCustomerId
      });
      throw error;
    }
  }
}

module.exports = GetOrderUseCase;
