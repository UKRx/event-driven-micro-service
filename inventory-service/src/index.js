// Main Entry Point - Inventory Service
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const { Kafka } = require('kafkajs');
const pino = require('pino');
const { v4: uuidv4 } = require('uuid');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

const app = express();
const PORT = process.env.PORT || 5002;

// MongoDB connection
let db;
let productsCollection;

const mongoClient = new MongoClient(
  process.env.MONGO_URI || 'mongodb://localhost:27017',
  { maxPoolSize: 10 }
);

// Kafka setup
const kafka = new Kafka({
  clientId: 'inventory-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'inventory-service-group' });

// Middleware
app.use(express.json());

// Simple auth extraction (Gateway validates)
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = payload;
    } catch (error) {
      logger.warn('Failed to parse JWT');
    }
  }
  next();
});

// Adjust stock endpoint (admin only)
app.post('/inventory/adjust', async (req, res) => {
  try {
    const { sku, delta } = req.body;

    if (!sku || typeof delta !== 'number') {
      return res.status(400).json({ error: 'Invalid request: sku and delta required' });
    }

    // Check admin role
    const isAdmin = req.user?.roles?.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    // Update stock atomically
    const result = await productsCollection.findOneAndUpdate(
      { _id: sku },
      {
        $inc: { available: delta },
        $set: { updatedAt: new Date().toISOString() },
        $setOnInsert: { sku, reserved: 0 }
      },
      { upsert: true, returnDocument: 'after' }
    );

    logger.info({
      message: 'Stock adjusted',
      sku,
      delta,
      newAvailable: result.available
    });

    res.status(200).json({
      sku: result.sku,
      available: result.available,
      reserved: result.reserved
    });
  } catch (error) {
    logger.error({ message: 'Failed to adjust stock', error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product endpoint (admin only)
app.get('/inventory/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const isAdmin = req.user?.roles?.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const product = await productsCollection.findOne({ _id: sku });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      sku: product.sku,
      available: product.available,
      reserved: product.reserved,
      updatedAt: product.updatedAt
    });
  } catch (error) {
    logger.error({ message: 'Failed to get product', error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/_health', async (req, res) => {
  try {
    await db.command({ ping: 1 });
    res.status(200).json({
      status: 'healthy',
      service: 'inventory-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy' }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'inventory-service',
      error: error.message
    });
  }
});

// Process OrderPlaced events
async function processOrderPlaced(event) {
  const { orderId, items, traceId, correlationId } = event;

  try {
    // Check if all items have sufficient stock
    const reservations = [];
    const rejectionDetails = [];

    for (const item of items) {
      const product = await productsCollection.findOne({ _id: item.sku });

      if (!product || product.available < item.qty) {
        rejectionDetails.push({
          sku: item.sku,
          requested: item.qty,
          available: product?.available || 0
        });
      } else {
        reservations.push(item);
      }
    }

    // If any item insufficient, reject entire order
    if (rejectionDetails.length > 0) {
      const rejectionEvent = {
        type: 'StockRejected',
        version: 1,
        orderId,
        reason: 'INSUFFICIENT_STOCK',
        details: rejectionDetails,
        traceId,
        correlationId,
        ts: new Date().toISOString()
      };

      await producer.send({
        topic: 'inventory.stock-rejected',
        messages: [{
          key: orderId,
          value: JSON.stringify(rejectionEvent),
          headers: {
            'event-id': uuidv4(),
            'event-type': 'StockRejected',
            'trace-id': traceId,
            'correlation-id': correlationId
          }
        }]
      });

      logger.info({
        message: 'Stock reservation rejected',
        orderId,
        reason: 'INSUFFICIENT_STOCK'
      });
      return;
    }

    // Reserve stock atomically for all items
    for (const item of reservations) {
      await productsCollection.updateOne(
        { _id: item.sku, available: { $gte: item.qty } },
        {
          $inc: { available: -item.qty, reserved: item.qty },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }

    // Publish StockReserved event
    const reservedEvent = {
      type: 'StockReserved',
      version: 1,
      orderId,
      reservations,
      traceId,
      correlationId,
      ts: new Date().toISOString()
    };

    await producer.send({
      topic: 'inventory.stock-reserved',
      messages: [{
        key: orderId,
        value: JSON.stringify(reservedEvent),
        headers: {
          'event-id': uuidv4(),
          'event-type': 'StockReserved',
          'trace-id': traceId,
          'correlation-id': correlationId
        }
      }]
    });

    logger.info({
      message: 'Stock reserved successfully',
      orderId,
      items: reservations
    });
  } catch (error) {
    logger.error({
      message: 'Failed to process OrderPlaced',
      orderId,
      error: error.message
    });
    throw error;
  }
}

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGO_DB || 'inventory');
    productsCollection = db.collection('products');

    // Create indexes
    await productsCollection.createIndex({ sku: 1 }, { unique: true });
    await productsCollection.createIndex({ available: 1 });

    logger.info('Connected to MongoDB');

    // Connect Kafka producer
    await producer.connect();
    logger.info('Kafka producer connected');

    // Connect Kafka consumer
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders.placed'], fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info({
            message: 'Received OrderPlaced event',
            orderId: event.orderId
          });
          await processOrderPlaced(event);
        } catch (error) {
          logger.error({
            message: 'Failed to process message',
            error: error.message
          });
        }
      }
    });

    logger.info('Kafka consumer started');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Inventory Service listening on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down');
      await consumer.disconnect();
      await producer.disconnect();
      await mongoClient.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ message: 'Failed to start server', error: error.message });
    process.exit(1);
  }
}

startServer();
