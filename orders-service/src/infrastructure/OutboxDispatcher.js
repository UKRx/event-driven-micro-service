// Infrastructure Layer: Outbox Pattern Background Dispatcher
const { Kafka } = require('kafkajs');

class OutboxDispatcher {
  constructor({ pool, kafkaBrokers, logger }) {
    this.pool = pool;
    this.logger = logger;
    this.running = false;
    this.pollInterval = 1000; // 1 second

    // Initialize Kafka producer
    const kafka = new Kafka({
      clientId: 'orders-service-outbox',
      brokers: kafkaBrokers.split(',')
    });
    this.producer = kafka.producer();
  }

  async start() {
    await this.producer.connect();
    this.running = true;
    this.logger.info('Outbox dispatcher started');
    this.poll();
  }

  async stop() {
    this.running = false;
    await this.producer.disconnect();
    this.logger.info('Outbox dispatcher stopped');
  }

  async poll() {
    while (this.running) {
      try {
        await this.processOutboxEvents();
        await this.sleep(this.pollInterval);
      } catch (error) {
        this.logger.error({
          message: 'Error in outbox dispatcher',
          error: error.message
        });
        await this.sleep(this.pollInterval);
      }
    }
  }

  async processOutboxEvents() {
    const client = await this.pool.connect();

    try {
      // Get unprocessed events (with limit to avoid overwhelming)
      const result = await client.query(
        `SELECT * FROM outbox
         WHERE processed_at IS NULL
         ORDER BY created_at
         LIMIT 100`
      );

      for (const event of result.rows) {
        try {
          const payload = typeof event.payload === 'string'
            ? JSON.parse(event.payload)
            : event.payload;

          // Determine Kafka topic based on event type
          const topic = this.getTopicForEventType(payload.type);

          // Publish to Kafka
          await this.producer.send({
            topic,
            messages: [
              {
                key: event.aggregate_id,
                value: JSON.stringify(payload),
                headers: {
                  'event-id': event.id.toString(),
                  'event-type': payload.type,
                  'trace-id': payload.traceId || '',
                  'correlation-id': payload.correlationId || ''
                }
              }
            ]
          });

          // Mark as processed
          await client.query(
            'UPDATE outbox SET processed_at = $1 WHERE id = $2',
            [new Date(), event.id]
          );

          this.logger.info({
            message: 'Outbox event published',
            eventId: event.id,
            eventType: payload.type,
            aggregateId: event.aggregate_id,
            topic
          });
        } catch (error) {
          this.logger.error({
            message: 'Failed to process outbox event',
            eventId: event.id,
            error: error.message
          });
          // Continue with next event
        }
      }
    } finally {
      client.release();
    }
  }

  getTopicForEventType(eventType) {
    const topicMap = {
      'OrderPlaced': 'orders.placed',
      'OrderConfirmed': 'orders.confirmed',
      'OrderCancelled': 'orders.cancelled'
    };
    return topicMap[eventType] || 'orders.events';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OutboxDispatcher;
