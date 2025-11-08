// API Gateway with JWT Validation and Routing
require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const pino = require('pino');

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
const PORT = process.env.PORT || 8080;

// JWKS client for Keycloak
const client = jwksClient({
  jwksUri: `${process.env.OIDC_ISSUER || 'http://localhost:8180/realms/shoplite'}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 3600000, // 1 hour
  rateLimit: true
});

// Get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// JWT Validation Middleware
function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.substring(7);

  jwt.verify(token, getKey, {
    issuer: process.env.OIDC_ISSUER || 'http://localhost:8180/realms/shoplite',
    audience: process.env.OIDC_AUDIENCE || 'shoplite-api',
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      logger.warn({
        message: 'JWT validation failed',
        error: err.message
      });
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user info to request
    req.user = decoded;
    req.user.roles = decoded.realm_access?.roles || [];

    logger.info({
      message: 'JWT validated',
      sub: decoded.sub,
      roles: req.user.roles
    });

    next();
  });
}

// Scope/Role enforcement middleware
function requireScope(...requiredScopes) {
  return (req, res, next) => {
    const userScopes = req.user?.scope?.split(' ') || [];
    const hasScope = requiredScopes.some(scope => userScopes.includes(scope));

    if (!hasScope) {
      logger.warn({
        message: 'Insufficient scopes',
        required: requiredScopes,
        actual: userScopes
      });
      return res.status(403).json({ error: 'Forbidden: Insufficient scopes' });
    }

    next();
  };
}

function requireRole(...requiredRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      logger.warn({
        message: 'Insufficient roles',
        required: requiredRoles,
        actual: userRoles
      });
      return res.status(403).json({ error: 'Forbidden: Insufficient roles' });
    }

    next();
  };
}

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check (public)
app.get('/_health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Routes with JWT validation and authorization

// Orders endpoints
app.use(
  '/orders',
  validateJWT,
  createProxyMiddleware({
    target: process.env.ORDERS_SERVICE_URL || 'http://localhost:5001',
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      // Forward JWT token
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    },
    onError: (err, req, res) => {
      logger.error({
        message: 'Proxy error',
        service: 'orders-service',
        error: err.message
      });
      res.status(503).json({ error: 'Service unavailable' });
    }
  })
);

// Inventory endpoints (admin only)
app.use(
  '/inventory',
  validateJWT,
  requireRole('admin'),
  createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002',
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    },
    onError: (err, req, res) => {
      logger.error({
        message: 'Proxy error',
        service: 'inventory-service',
        error: err.message
      });
      res.status(503).json({ error: 'Service unavailable' });
    }
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
  logger.info(`OIDC Issuer: ${process.env.OIDC_ISSUER || 'http://localhost:8180/realms/shoplite'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
