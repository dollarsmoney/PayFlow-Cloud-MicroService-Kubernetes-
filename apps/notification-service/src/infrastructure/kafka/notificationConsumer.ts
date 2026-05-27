import {
  KafkaConsumer, Topics,
  UserCreatedEvent, PaymentCompletedEvent, PaymentFailedEvent, FraudDetectedEvent,
} from '@payflow/events';
import { prisma } from '@payflow/db';
import { logger } from '@payflow/logger';

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
}

async function saveAndLog(payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
    },
  });
  // Simulated email/push — in production replace with Nodemailer/FCM/etc.
  logger.info(`[NotificationService] 📬 SEND → userId:${payload.userId} | ${payload.title}`);
  logger.info(`[NotificationService]    Message: ${payload.message}`);
  return notification;
}

export async function startNotificationConsumer(): Promise<void> {
  const consumer = new KafkaConsumer('notification-service-group', 'notification-service');

  await consumer.subscribe([
    Topics.USER_CREATED,
    Topics.PAYMENT_COMPLETED,
    Topics.PAYMENT_FAILED,
    Topics.FRAUD_DETECTED,
  ]);

  await consumer.run<any>(async (event, raw) => {
    const topic = raw.topic;

    if (topic === Topics.USER_CREATED) {
      const e = event as UserCreatedEvent;
      await saveAndLog({
        userId: e.userId,
        type: 'WELCOME',
        title: 'Welcome to PayFlow! 🎉',
        message: `Hi! Your account has been created successfully. Start by adding funds to your wallet.`,
      });
    }

    if (topic === Topics.PAYMENT_COMPLETED) {
      const e = event as PaymentCompletedEvent;
      await saveAndLog({
        userId: e.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful ✅',
        message: `Your payment of ${e.currency} ${e.amount.toFixed(2)} was processed successfully (ID: ${e.paymentId}).`,
      });
    }

    if (topic === Topics.PAYMENT_FAILED) {
      const e = event as PaymentFailedEvent;
      await saveAndLog({
        userId: e.userId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed ❌',
        message: `Your payment of ${e.currency} ${e.amount.toFixed(2)} could not be processed. Reason: ${e.reason}.`,
      });
    }

    if (topic === Topics.FRAUD_DETECTED) {
      const e = event as FraudDetectedEvent;
      await saveAndLog({
        userId: e.userId,
        type: 'FRAUD_ALERT',
        title: '⚠️ Security Alert',
        message: `Suspicious activity was detected on your account (Transaction: ${e.transactionId}). Risk score: ${(e.riskScore * 100).toFixed(0)}%. Our team is investigating.`,
      });
    }
  });

  logger.info('[NotificationConsumer] Listening on: user.created, payment.completed, payment.failed, fraud.detected');

  const shutdown = async () => { await consumer.disconnect(); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
