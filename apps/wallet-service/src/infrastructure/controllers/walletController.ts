import { Request, Response } from 'express';
import { WalletService } from '../../application/services/walletService';

const walletService = new WalletService();

export class WalletController {
  async create(req: Request, res: Response) {
    try {
      const { userId, currency } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const wallet = await walletService.createWallet(userId, currency);
      res.status(201).json(wallet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const wallets = await walletService.getWalletsByUserId(userId);
      res.status(200).json(wallets);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { walletId } = req.params;
      const wallet = await walletService.getWalletById(walletId);
      res.status(200).json(wallet);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async deposit(req: Request, res: Response) {
    try {
      const { walletId } = req.params;
      const { amount, referenceId } = req.body;
      if (!amount) return res.status(400).json({ error: 'amount is required' });
      const wallet = await walletService.deposit(walletId, Number(amount), referenceId);
      res.status(200).json({ message: 'Deposit successful', wallet });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async withdraw(req: Request, res: Response) {
    try {
      const { walletId } = req.params;
      const { amount, referenceId } = req.body;
      if (!amount) return res.status(400).json({ error: 'amount is required' });
      const wallet = await walletService.withdraw(walletId, Number(amount), referenceId);
      res.status(200).json({ message: 'Withdrawal successful', wallet });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async transfer(req: Request, res: Response) {
    try {
      const { fromWalletId, toWalletId, amount } = req.body;
      if (!fromWalletId || !toWalletId || !amount) {
        return res.status(400).json({ error: 'fromWalletId, toWalletId, amount are required' });
      }
      const result = await walletService.transfer(fromWalletId, toWalletId, Number(amount));
      res.status(200).json({ message: 'Transfer successful', ...result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLedger(req: Request, res: Response) {
    try {
      const { walletId } = req.params;
      const page  = parseInt(req.query.page  as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await walletService.getLedger(walletId, page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
