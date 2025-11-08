// Presentation Layer: HTTP Controllers
const express = require('express');
const Joi = require('joi');

class OrdersController {
  constructor({ createOrderUseCase, getOrderUseCase, logger }) {
    this.createOrderUseCase = createOrderUseCase;
    this.getOrderUseCase = getOrderUseCase;
    this.logger = logger;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post('/orders', this.createOrder.bind(this));
    this.router.get('/orders/:id', this.getOrder.bind(this));
  }

  async createOrder(req, res) {
    try {
      // Validation
      const schema = Joi.object({
        items: Joi.array().items(
          Joi.object({
            sku: Joi.string().required(),
            qty: Joi.number().integer().min(1).required()
          })
        ).min(1).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details[0].message
        });
      }

      // Get customer ID from JWT (set by auth middleware)
      const customerId = req.user?.sub;
      if (!customerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const traceId = req.headers['x-trace-id'] || req.id;
      const correlationId = req.headers['x-correlation-id'] || req.id;

      const result = await this.createOrderUseCase.execute({
        customerId,
        items: value.items,
        traceId,
        correlationId
      });

      res.status(201).json(result);
    } catch (error) {
      this.logger.error({
        message: 'Create order failed',
        error: error.message
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOrder(req, res) {
    try {
      const orderId = req.params.id;
      const requestingCustomerId = req.user?.sub;
      const isAdmin = req.user?.roles?.includes('admin') || false;

      if (!requestingCustomerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const order = await this.getOrderUseCase.execute({
        orderId,
        requestingCustomerId,
        isAdmin
      });

      res.status(200).json(order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      this.logger.error({
        message: 'Get order failed',
        error: error.message
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = OrdersController;
