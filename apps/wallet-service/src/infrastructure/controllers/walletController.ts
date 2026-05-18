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
