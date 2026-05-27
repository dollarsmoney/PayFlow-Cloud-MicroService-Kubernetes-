import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@payflow/logger';
import { prisma } from '@payflow/db';
import { startNotificationConsumer } from './infrastructure/kafka/notificationConsumer';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(cors());
app.use(helmet());

// Get notifications for a user
app.get('/api/v1/notifications/:userId', async (req, res) => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip  = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.params.userId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.params.userId } }),
    ]);
    res.json({ notifications, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
app.patch('/api/v1/notifications/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Mark all as read for a user
app.patch('/api/v1/notifications/:userId/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.params.userId, read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));

const server = app.listen(PORT, async () => {
  logger.info(`Notification Service running on port ${PORT}`);
  try {
    await startNotificationConsumer();
  } catch (err) {
    logger.error('[NotificationService] Failed to start consumer', err);
  }
});

const shutdown = () => { server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
