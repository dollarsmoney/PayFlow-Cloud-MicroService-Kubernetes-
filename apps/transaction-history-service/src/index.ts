import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@payflow/logger';
import { prisma } from '@payflow/db';
import { startHistoryConsumer } from './infrastructure/kafka/historyConsumer';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use(cors());
app.use(helmet());

// GET /api/v1/history/:userId — paginated transaction ledger
app.get('/api/v1/history/:userId', async (req, res) => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip  = (page - 1) * limit;

    // Get all wallets for the user
    const wallets = await prisma.wallet.findMany({ where: { userId: req.params.userId }, select: { id: true } });
    const walletIds = wallets.map((w) => w.id);

    if (!walletIds.length) {
      return res.json({ entries: [], total: 0, page, limit });
    }

    const [entries, total] = await Promise.all([
      prisma.ledger.findMany({
        where: { walletId: { in: walletIds } },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { wallet: { select: { currency: true } } },
      }),
      prisma.ledger.count({ where: { walletId: { in: walletIds } } }),
    ]);

    res.json({ entries, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/history/wallet/:walletId — ledger for a specific wallet
app.get('/api/v1/history/wallet/:walletId', async (req, res) => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip  = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.ledger.findMany({
        where: { walletId: req.params.walletId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ledger.count({ where: { walletId: req.params.walletId } }),
    ]);
    res.json({ entries, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'transaction-history-service' }));

const server = app.listen(PORT, async () => {
  logger.info(`Transaction History Service running on port ${PORT}`);
  try {
    await startHistoryConsumer();
  } catch (err) {
    logger.error('[HistoryService] Failed to start consumer', err);
  }
});

const shutdown = () => { server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
