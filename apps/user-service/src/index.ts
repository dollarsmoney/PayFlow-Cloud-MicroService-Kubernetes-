import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@payflow/logger';
import userRoutes from './infrastructure/routes/userRoutes';
import { startUserConsumer } from './infrastructure/kafka/userConsumer';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/v1/users', userRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }));

const server = app.listen(PORT, async () => {
  logger.info(`User Service running on port ${PORT}`);
  try {
    await startUserConsumer();
  } catch (err) {
    logger.error('[UserService] Failed to start Kafka consumer', err);
  }
});

const shutdown = () => {
  logger.info('Shutting down user-service...');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
