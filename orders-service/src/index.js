// Main Entry Point - Orders Service
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const pino = require('pino');

// Domain
const Order = require('./domain/Order');

// Application
const CreateOrderUseCase = require('./application/CreateOrderUseCase');
const GetOrderUseCase = require('./application/GetOrderUseCase');
const ProcessStockEventUseCase = require('./application/ProcessStockEventUseCase');

// Infrastructure
const PostgresOrderRepository = require('./infrastructure/PostgresOrderRepository');
const OutboxDispatcher = require('./infrastructure/OutboxDispatcher');
const StockEventConsumer = require('./infrastructure/StockEventConsumer');

// Presentation
const OrdersController = require('./presentation/OrdersController');

// Logger
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

// PostgreSQL Pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'orders',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Dependency Injection Container
const orderRepository = new PostgresOrderRepository({ pool, logger });

const createOrderUseCase = new CreateOrderUseCase({
  orderRepository,
  logger
});

const getOrderUseCase = new GetOrderUseCase({
  orderRepository,
  logger
});

const processStockEventUseCase = new ProcessStockEventUseCase({
  orderRepository,
  logger
});

// Controllers
const ordersController = new OrdersController({
  createOrderUseCase,
  getOrderUseCase,
  logger
});

// Express App
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Simple JWT extraction (for development - Gateway should validate)
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = payload;
    } catch (error) {
      logger.warn('Failed to parse JWT token');
    }
  }
  next();
});

// Routes
app.use(ordersController.getRouter());

// Health check
app.get('/_health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'orders-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy' }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'orders-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Initialize database and start server
async function initDatabase() {
  const fs = require('fs');
  const path = require('path');

  try {
    const migrationPath = path.join(__dirname, '../migrations/001_init_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const migration = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migration);
      logger.info('Database schema initialized');
    }
  } catch (error) {
    logger.error({ message: 'Failed to initialize database', error: error.message });
    throw error;
  }
}

async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Start Outbox Dispatcher
    const outboxDispatcher = new OutboxDispatcher({
      pool,
      kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
      logger
    });
    await outboxDispatcher.start();

    // Start Stock Event Consumer
    const stockEventConsumer = new StockEventConsumer({
      kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
      processStockEventUseCase,
      logger
    });
    await stockEventConsumer.start();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Orders Service listening on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await outboxDispatcher.stop();
      await stockEventConsumer.stop();
      await pool.end();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ message: 'Failed to start server', error: error.message });
    process.exit(1);
  }
}

startServer();
