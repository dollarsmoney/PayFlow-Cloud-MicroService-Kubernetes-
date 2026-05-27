import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { logger } from '@payflow/logger';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(helmet());
// Removed express.json() because API gateway proxies all traffic. 
// If we parse the body here, the stream is consumed and microservices will hang.

// Request ID injection
app.use((req, _res, next) => {
  (req as Record<string, unknown>).requestId = randomUUID();
  next();
});

// Structured request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      requestId: (req as Record<string, unknown>).requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

// Global rate limiter: 200 req/minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Auth-specific stricter rate limiter: 20 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});

app.use(globalLimiter);

// ── JWT Auth Middleware ─────────────────────────────────────
const PUBLIC_PATHS = [
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/refresh',
  '/health',
];

app.use(async (req, res, next) => {
  // Skip public paths
  if (PUBLIC_PATHS.some((p) => req.path.startsWith(p))) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if token is blacklisted in Redis
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.headers['x-user-id']    = payload.userId;
    req.headers['x-user-role']  = payload.role;
    req.headers['x-request-id'] = randomUUID();
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ── Proxy factory ────────────────────────────────────────────
function proxy(target: string, pathPrefix: string, targetPrefix: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${pathPrefix}`]: targetPrefix },
    on: {
      error: (_err, _req, res) => {
        logger.error(`Proxy error → ${target}`);
        // res here is ServerResponse | Socket
        if (res && 'status' in res && typeof (res as express.Response).status === 'function') {
          (res as express.Response).status(502).json({ error: 'Service temporarily unavailable' });
        }
      },
    },
  });
}

// ── Proxy Routes ────────────────────────────────────────────
app.use('/api/auth',          authLimiter, proxy('http://auth-service:3001',                '/api/auth',          '/api/v1/auth'));
app.use('/api/users',                      proxy('http://user-service:3002',                '/api/users',         '/api/v1/users'));
app.use('/api/wallets',                    proxy('http://wallet-service:3003',              '/api/wallets',       '/api/v1/wallets'));
app.use('/api/payments',                   proxy('http://payment-service:8080',             '/api/payments',      '/api/v1/payments'));
app.use('/api/notifications',              proxy('http://notification-service:3004',        '/api/notifications', '/api/v1/notifications'));
app.use('/api/history',                    proxy('http://transaction-history-service:3006', '/api/history',       '/api/v1/history'));
app.use('/api/fraud',                      proxy('http://fraud-detection-service:3005',     '/api/fraud',         '/api/v1/fraud'));

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    endpoints: [
      'POST /api/auth/signup', 'POST /api/auth/login', 'POST /api/auth/refresh', 'POST /api/auth/logout',
      'GET  /api/users/:userId/profile', 'PATCH /api/users/:userId/profile',
      'POST /api/wallets', 'GET /api/wallets/user/:userId',
      'POST /api/wallets/:id/deposit', 'POST /api/wallets/:id/withdraw', 'POST /api/wallets/transfer',
      'POST /api/payments/process', 'GET /api/payments/:id/status',
      'GET  /api/notifications/:userId',
      'GET  /api/history/:userId',
      'GET  /api/fraud/alerts',
    ],
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

const shutdown = () => {
  logger.info('Shutting down api-gateway...');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
