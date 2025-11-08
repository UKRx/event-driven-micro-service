// Application Layer: Process Stock Reserved/Rejected Events

class ProcessStockEventUseCase {
  constructor({ orderRepository, logger }) {
    this.orderRepository = orderRepository;
    this.logger = logger;
  }

  async processStockReserved({ orderId, traceId, correlationId }) {
    try {
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        this.logger.warn({
          message: 'Order not found for StockReserved event',
          orderId,
          traceId
        });
        return;
      }

      // Update order status to CONFIRMED
      order.confirm();
      await this.orderRepository.update(order);

      this.logger.info({
        message: 'Order confirmed after stock reservation',
        orderId,
        traceId,
        correlationId
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to process StockReserved event',
        error: error.message,
        orderId,
        traceId
      });
      throw error;
    }
  }

  async processStockRejected({ orderId, reason, traceId, correlationId }) {
    try {
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        this.logger.warn({
          message: 'Order not found for StockRejected event',
          orderId,
          traceId
        });
        return;
      }

      // Update order status to CANCELLED
      order.cancel();
      await this.orderRepository.update(order);

      this.logger.info({
        message: 'Order cancelled due to stock rejection',
        orderId,
        reason,
        traceId,
        correlationId
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to process StockRejected event',
        error: error.message,
        orderId,
        traceId
      });
      throw error;
    }
  }
}

module.exports = ProcessStockEventUseCase;
