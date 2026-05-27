import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@payflow/logger';
import walletRoutes from './infrastructure/routes/walletRoutes';
import { startWalletConsumer } from './infrastructure/kafka/walletConsumer';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/v1/wallets', walletRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'wallet-service' }));

const server = app.listen(PORT, async () => {
  logger.info(`Wallet Service running on port ${PORT}`);
  try {
    await startWalletConsumer();
  } catch (err) {
    logger.error('[WalletService] Failed to start Kafka consumer', err);
  }
});

const shutdown = () => {
  logger.info('Shutting down wallet-service...');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
