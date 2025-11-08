// Infrastructure Layer: Kafka Consumer for Stock Events
const { Kafka } = require('kafkajs');

class StockEventConsumer {
  constructor({ kafkaBrokers, processStockEventUseCase, logger }) {
    this.processStockEventUseCase = processStockEventUseCase;
    this.logger = logger;
    this.processedEvents = new Set(); // Simple in-memory idempotency

    const kafka = new Kafka({
      clientId: 'orders-service-consumer',
      brokers: kafkaBrokers.split(',')
    });

    this.consumer = kafka.consumer({
      groupId: 'orders-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
  }

  async start() {
    await this.consumer.connect();

    // Subscribe to inventory topics
    await this.consumer.subscribe({
      topics: ['inventory.stock-reserved', 'inventory.stock-rejected'],
      fromBeginning: false
    });

    this.logger.info('Stock event consumer started');

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          const eventId = message.headers['event-id']?.toString();

          // Idempotency check
          if (eventId && this.processedEvents.has(eventId)) {
            this.logger.info({
              message: 'Duplicate event ignored',
              eventId,
              eventType: event.type
            });
            return;
          }

          // Process event based on type
          if (event.type === 'StockReserved') {
            await this.processStockEventUseCase.processStockReserved({
              orderId: event.orderId,
              traceId: event.traceId,
              correlationId: event.correlationId
            });
          } else if (event.type === 'StockRejected') {
            await this.processStockEventUseCase.processStockRejected({
              orderId: event.orderId,
              reason: event.reason,
              traceId: event.traceId,
              correlationId: event.correlationId
            });
          }

          // Mark as processed
          if (eventId) {
            this.processedEvents.add(eventId);
            // Clean old events (keep last 10000)
            if (this.processedEvents.size > 10000) {
              const toDelete = Array.from(this.processedEvents).slice(0, 1000);
              toDelete.forEach(id => this.processedEvents.delete(id));
            }
          }

          this.logger.info({
            message: 'Stock event processed',
            topic,
            eventType: event.type,
            orderId: event.orderId
          });
        } catch (error) {
          this.logger.error({
            message: 'Failed to process stock event',
            topic,
            error: error.message,
            messageValue: message.value.toString()
          });
          // Don't throw - let consumer continue with next message
        }
      }
    });
  }

  async stop() {
    await this.consumer.disconnect();
    this.logger.info('Stock event consumer stopped');
  }
}

module.exports = StockEventConsumer;
