import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@payflow/logger';
import authRoutes from './infrastructure/routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use(helmet());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/v1/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

const server = app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down auth-service...');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
