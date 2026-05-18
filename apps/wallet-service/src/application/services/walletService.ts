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
