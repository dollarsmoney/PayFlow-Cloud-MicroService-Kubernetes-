import { prisma, Prisma } from '@payflow/db';
import { KafkaProducer, Topics, WalletUpdatedEvent } from '@payflow/events';
import { logger } from '@payflow/logger';

const producer = new KafkaProducer('wallet-service');

export class WalletService {
  // ── Create ──────────────────────────────────────────────
  async createWallet(userId: string, currency: string = 'USD') {
    let wallet = await prisma.wallet.findFirst({ where: { userId, currency } });
    if (!wallet) {
      try {
        wallet = await prisma.wallet.create({
          data: { userId, currency, balance: 0 },
        });
        logger.info(`[WalletService] Created wallet ${wallet.id} for user ${userId}`);
      } catch (err: any) {
        // If concurrent request created it, find it again
        if (err.code === 'P2002') {
          wallet = await prisma.wallet.findFirst({ where: { userId, currency } });
        } else {
          throw err;
        }
      }
    }
    return wallet!;
  }

  // ── Get ──────────────────────────────────────────────────
  async getWalletsByUserId(userId: string) {
    const wallets = await prisma.wallet.findMany({ where: { userId } });
    if (!wallets.length) throw new Error('No wallets found for this user');
    return wallets;
  }

  async getWalletById(walletId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error('Wallet not found');
    return wallet;
  }

  // ── Deposit ──────────────────────────────────────────────
  async deposit(walletId: string, amount: number, referenceId?: string) {
    if (amount <= 0) throw new Error('Deposit amount must be positive');

    const wallet = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!w) throw new Error('Wallet not found');
      if (w.status !== 'ACTIVE') throw new Error('Wallet is frozen');

      await tx.ledger.create({
        data: {
          walletId,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(amount),
          currency: w.currency,
          referenceId: referenceId ?? null,
          status: 'COMPLETED',
        },
      });

      return tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });
    });

    this.publishWalletUpdated(wallet, 'DEPOSIT', referenceId); // Fire-and-forget
    logger.info(`[WalletService] Deposited ${amount} to wallet ${walletId}`);
    return wallet;
  }

  // ── Withdraw ─────────────────────────────────────────────
  async withdraw(walletId: string, amount: number, referenceId?: string) {
    if (amount <= 0) throw new Error('Withdrawal amount must be positive');

    const wallet = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!w) throw new Error('Wallet not found');
      if (w.status !== 'ACTIVE') throw new Error('Wallet is frozen');
      if (w.balance.toNumber() < amount) throw new Error('Insufficient balance');

      await tx.ledger.create({
        data: {
          walletId,
          type: 'WITHDRAWAL',
          amount: new Prisma.Decimal(amount),
          currency: w.currency,
          referenceId: referenceId ?? null,
          status: 'COMPLETED',
        },
      });

      // Optimistic concurrency check to prevent double spending
      const updated = await tx.wallet.updateMany({
        where: { id: walletId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });

      if (updated.count === 0) {
        throw new Error('Insufficient balance or concurrent transaction');
      }

      return tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    });

    this.publishWalletUpdated(wallet, 'WITHDRAWAL', referenceId); // Fire-and-forget
    logger.info(`[WalletService] Withdrew ${amount} from wallet ${walletId}`);
    return wallet;
  }

  // ── Transfer ─────────────────────────────────────────────
  async transfer(fromWalletId: string, toWalletId: string, amount: number) {
    if (amount <= 0) throw new Error('Transfer amount must be positive');
    if (fromWalletId === toWalletId) throw new Error('Cannot transfer to the same wallet');

    const [fromWallet, toWallet] = await prisma.$transaction(async (tx) => {
      const from = await tx.wallet.findUnique({ where: { id: fromWalletId } });
      const to   = await tx.wallet.findUnique({ where: { id: toWalletId } });

      if (!from) throw new Error('Source wallet not found');
      if (!to)   throw new Error('Destination wallet not found');
      if (from.status !== 'ACTIVE') throw new Error('Source wallet is frozen');
      if (to.status   !== 'ACTIVE') throw new Error('Destination wallet is frozen');
      if (from.currency !== to.currency) throw new Error('Currency mismatch between wallets');
      if (from.balance.toNumber() < amount) throw new Error('Insufficient balance');

      const referenceId = `transfer-${Date.now()}`;

      await tx.ledger.create({
        data: { walletId: fromWalletId, type: 'TRANSFER_OUT', amount: new Prisma.Decimal(amount), currency: from.currency, referenceId, status: 'COMPLETED' },
      });
      await tx.ledger.create({
        data: { walletId: toWalletId, type: 'TRANSFER_IN', amount: new Prisma.Decimal(amount), currency: to.currency, referenceId, status: 'COMPLETED' },
      });

      // Optimistic concurrency check for source wallet
      const updatedFrom = await tx.wallet.updateMany({
        where: { id: fromWalletId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      
      if (updatedFrom.count === 0) {
        throw new Error('Insufficient balance or concurrent transaction on source wallet');
      }

      await tx.wallet.update({ where: { id: toWalletId },   data: { balance: { increment: amount } } });

      const finalFrom = await tx.wallet.findUniqueOrThrow({ where: { id: fromWalletId } });
      const finalTo   = await tx.wallet.findUniqueOrThrow({ where: { id: toWalletId } });

      return [finalFrom, finalTo];
    });

    this.publishWalletUpdated(fromWallet, 'TRANSFER_OUT'); // Fire-and-forget
    this.publishWalletUpdated(toWallet,   'TRANSFER_IN');  // Fire-and-forget
    logger.info(`[WalletService] Transferred ${amount} from ${fromWalletId} to ${toWalletId}`);
    return { from: fromWallet, to: toWallet };
  }

  // ── Debit (called by Kafka consumer after payment.completed) ──
  async debitForPayment(userId: string, amount: number, paymentId: string) {
    const wallet = await prisma.wallet.findFirst({ where: { userId, currency: 'USD', status: 'ACTIVE' } });
    if (!wallet) {
      logger.warn(`[WalletService] No active USD wallet for user ${userId}`);
      return;
    }
    
    // Check idempotency: Have we already debited for this payment?
    const existingLedgerEntry = await prisma.ledger.findFirst({
      where: { walletId: wallet.id, referenceId: paymentId }
    });
    
    if (existingLedgerEntry) {
      logger.info(`[WalletService] Idempotency catch: payment ${paymentId} already debited.`);
      return;
    }

    if (wallet.balance.toNumber() < amount) {
      logger.warn(`[WalletService] Insufficient balance for payment debit on wallet ${wallet.id}`);
      return;
    }
    await this.withdraw(wallet.id, amount, paymentId);
  }

  // ── Ledger History ───────────────────────────────────────
  async getLedger(walletId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      prisma.ledger.findMany({ where: { walletId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.ledger.count({ where: { walletId } }),
    ]);
    return { entries, total, page, limit };
  }

  // ── Internal helpers ─────────────────────────────────────
  private async publishWalletUpdated(
    wallet: { id: string; userId: string; balance: Prisma.Decimal; currency: string },
    operation: WalletUpdatedEvent['operation'],
    referenceId?: string
  ) {
    const event: WalletUpdatedEvent = {
      walletId: wallet.id,
      userId: wallet.userId,
      newBalance: wallet.balance.toNumber(),
      currency: wallet.currency,
      operation,
      referenceId,
      timestamp: new Date().toISOString(),
    };
    
    // Fire-and-forget with a 5s timeout to not block APIs on Kafka slowness
    const publishWithTimeout = Promise.race([
      producer.publish(Topics.WALLET_UPDATED, event),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Kafka publish timeout')), 5000))
    ]);
    
    publishWithTimeout
      .then(() => logger.info(`[WalletService] wallet.updated published for wallet ${wallet.id}`))
      .catch((err) => logger.warn(`[WalletService] Kafka publish failed (non-fatal): ${err.message}`));
  }
}
