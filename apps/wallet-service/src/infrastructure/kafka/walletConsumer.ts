import { KafkaConsumer, Topics, UserCreatedEvent, PaymentCompletedEvent } from '@payflow/events';
import { WalletService } from '../../application/services/walletService';
import { logger } from '@payflow/logger';

const walletService = new WalletService();

export async function startWalletConsumer(): Promise<void> {
  const consumer = new KafkaConsumer('wallet-service-group', 'wallet-service');

  await consumer.subscribe([Topics.USER_CREATED, Topics.PAYMENT_COMPLETED]);

  // We need to differentiate between event types by topic
  // KafkaConsumer.run receives the raw payload too
  await consumer.run<any>(async (event, raw) => {
    const topic = raw.topic;

    if (topic === Topics.USER_CREATED) {
      const e = event as UserCreatedEvent;
      logger.info(`[WalletConsumer] Creating default USD wallet for user: ${e.userId}`);
      await walletService.createWallet(e.userId, 'USD');
    }

    if (topic === Topics.PAYMENT_COMPLETED) {
      const e = event as PaymentCompletedEvent;
      logger.info(`[WalletConsumer] Debiting wallet for payment: ${e.paymentId}`);
      await walletService.debitForPayment(e.userId, e.amount, e.paymentId);
    }
  });

  logger.info('[WalletConsumer] Listening on: user.created, payment.completed');

  const shutdown = async () => { await consumer.disconnect(); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
