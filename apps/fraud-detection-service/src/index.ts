import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@payflow/logger';
import { prisma } from '@payflow/db';
import { startFraudConsumer } from './infrastructure/kafka/fraudConsumer';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(cors());
app.use(helmet());

// List all fraud alerts (paginated)
app.get('/api/v1/fraud/alerts', async (req, res) => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip  = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      prisma.fraudAlert.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.fraudAlert.count(),
    ]);
    res.json({ alerts, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts for a specific user
app.get('/api/v1/fraud/alerts/user/:userId', async (req, res) => {
  try {
    const alerts = await prisma.fraudAlert.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve an alert
app.patch('/api/v1/fraud/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await prisma.fraudAlert.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED' },
    });
    res.json(alert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'fraud-detection-service' }));

const server = app.listen(PORT, async () => {
  logger.info(`Fraud Detection Service running on port ${PORT}`);
  try {
    await startFraudConsumer();
  } catch (err) {
    logger.error('[FraudService] Failed to start consumer', err);
  }
});

const shutdown = () => { server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
