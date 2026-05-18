const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('apps/wallet-service/src/index.ts', `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import walletRoutes from './infrastructure/routes/walletRoutes';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/api/v1/wallets', walletRoutes);

app.get('/health', (req, res) => res.send('Wallet Service OK'));

app.listen(PORT, () => {
  console.log(\`Wallet Service running on port \${PORT}\`);
});
`);

write('apps/wallet-service/src/infrastructure/routes/walletRoutes.ts', `
import { Router } from 'express';
import { WalletController } from '../controllers/walletController';

const router = Router();
const walletController = new WalletController();

router.post('/create', (req, res) => walletController.create(req, res));
router.get('/:userId/balance', (req, res) => walletController.getBalance(req, res));

export default router;
`);

write('apps/wallet-service/src/infrastructure/controllers/walletController.ts', `
import { Request, Response } from 'express';
import { WalletService } from '../../application/services/walletService';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  async create(req: Request, res: Response) {
    try {
      const { userId, currency } = req.body;
      const wallet = await this.walletService.createWallet(userId, currency);
      res.status(201).json(wallet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const wallet = await this.walletService.getWalletByUserId(userId);
      res.status(200).json(wallet);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}
`);

write('apps/wallet-service/src/application/services/walletService.ts', `
import { prisma } from '@payflow/db';

export class WalletService {
  async createWallet(userId: string, currency: string = 'USD') {
    const existing = await prisma.wallet.findFirst({ where: { userId, currency } });
    if (existing) throw new Error('Wallet already exists for this currency');

    return prisma.wallet.create({
      data: {
        userId,
        currency,
        balance: 0.00,
      }
    });
  }

  async getWalletByUserId(userId: string) {
    const wallets = await prisma.wallet.findMany({ where: { userId } });
    if (!wallets.length) throw new Error('Wallet not found');
    return wallets;
  }
}
`);

console.log('Wallet service logic generated.');
