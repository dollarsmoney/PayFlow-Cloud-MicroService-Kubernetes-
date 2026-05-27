import {
  KafkaConsumer, Topics,
  PaymentCompletedEvent, PaymentFailedEvent, WalletUpdatedEvent,
} from '@payflow/events';
import { prisma, Prisma } from '@payflow/db';
import { logger } from '@payflow/logger';

export async function startHistoryConsumer(): Promise<void> {
  const consumer = new KafkaConsumer('history-service-group', 'transaction-history-service');

  await consumer.subscribe([
    Topics.PAYMENT_COMPLETED,
    Topics.PAYMENT_FAILED,
    Topics.WALLET_UPDATED,
  ]);

  await consumer.run<any>(async (event, raw) => {
    const topic = raw.topic;

    if (topic === Topics.PAYMENT_COMPLETED) {
      const e = event as PaymentCompletedEvent;
      logger.info(`[HistoryConsumer] Recording completed payment: ${e.paymentId}`);

      // Find user's USD wallet to attach ledger entry
      const wallet = await prisma.wallet.findFirst({
        where: { userId: e.userId, currency: e.currency || 'USD' },
      });
      if (!wallet) {
        logger.warn(`[HistoryConsumer] No wallet found for user ${e.userId}, skipping ledger`);
        return;
      }

      // Ensure idempotency for ledger creation under concurrent delivery
      await prisma.$transaction(async (tx) => {
        const existing = await tx.ledger.findFirst({ where: { referenceId: e.paymentId } });
        if (!existing) {
          await tx.ledger.create({
            data: {
              walletId: wallet.id,
              type: 'WITHDRAWAL',
              amount: new Prisma.Decimal(e.amount),
              currency: e.currency || 'USD',
              referenceId: e.paymentId,
              status: 'COMPLETED',
            },
          });
        }
      });
    }

    if (topic === Topics.PAYMENT_FAILED) {
      const e = event as PaymentFailedEvent;
      logger.info(`[HistoryConsumer] Recording failed payment: ${e.paymentId}`);

      const wallet = await prisma.wallet.findFirst({
        where: { userId: e.userId, currency: e.currency || 'USD' },
      });
      if (!wallet) return;

      await prisma.$transaction(async (tx) => {
        const existing = await tx.ledger.findFirst({ where: { referenceId: e.paymentId } });
        if (!existing) {
          await tx.ledger.create({
            data: {
              walletId: wallet.id,
              type: 'WITHDRAWAL',
              amount: new Prisma.Decimal(e.amount),
              currency: e.currency || 'USD',
              referenceId: e.paymentId,
              status: 'FAILED',
            },
          });
        }
      });
    }

    if (topic === Topics.WALLET_UPDATED) {
      // wallet-service handles ledger natively; just log for observability
      const e = event as WalletUpdatedEvent;
      logger.info(`[HistoryConsumer] Wallet updated: ${e.walletId} | op: ${e.operation} | balance: ${e.newBalance}`);
    }
  });

  logger.info('[HistoryConsumer] Listening on: payment.completed, payment.failed, wallet.updated');

  const shutdown = async () => { await consumer.disconnect(); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
