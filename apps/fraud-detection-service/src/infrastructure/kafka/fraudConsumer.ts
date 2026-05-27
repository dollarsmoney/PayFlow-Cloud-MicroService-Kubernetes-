import { KafkaConsumer, KafkaProducer, Topics, PaymentCompletedEvent, FraudDetectedEvent } from '@payflow/events';
import { prisma } from '@payflow/db';
import { logger } from '@payflow/logger';

const producer = new KafkaProducer('fraud-detection-service');

// In-memory velocity tracker: userId -> list of timestamps
const velocityMap = new Map<string, number[]>();

interface FraudRule {
  name: string;
  check: (event: PaymentCompletedEvent) => { triggered: boolean; score: number; reason: string };
}

const FRAUD_RULES: FraudRule[] = [
  {
    name: 'HIGH_AMOUNT',
    check: (e) => ({
      triggered: e.amount > 10000,
      score: Math.min(e.amount / 10000 * 0.5, 0.9),
      reason: `Transaction amount $${e.amount} exceeds $10,000 threshold`,
    }),
  },
  {
    name: 'VELOCITY_CHECK',
    check: (e) => {
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const timestamps = (velocityMap.get(e.userId) || []).filter((t) => now - t < windowMs);
      timestamps.push(now);
      velocityMap.set(e.userId, timestamps);
      const count = timestamps.length;
      return {
        triggered: count > 5,
        score: Math.min(count / 10, 0.95),
        reason: `${count} transactions in the last 60 seconds (limit: 5)`,
      };
    },
  },
  {
    name: 'UNUSUAL_CURRENCY',
    check: (e) => ({
      triggered: !['USD', 'EUR', 'GBP', 'JPY'].includes(e.currency),
      score: 0.4,
      reason: `Unusual currency detected: ${e.currency}`,
    }),
  },
  {
    name: 'ROUND_AMOUNT_STRUCTURING',
    check: (e) => {
      // Structuring: multiple round amounts just below reporting threshold
      const isRound = e.amount % 1000 === 0 && e.amount >= 5000 && e.amount < 10000;
      return {
        triggered: isRound,
        score: 0.5,
        reason: `Possible structuring: round amount $${e.amount} just below $10k threshold`,
      };
    },
  },
];

export async function startFraudConsumer(): Promise<void> {
  const consumer = new KafkaConsumer('fraud-detection-group', 'fraud-detection-service');
  await consumer.subscribe([Topics.PAYMENT_COMPLETED]);

  await consumer.run<PaymentCompletedEvent>(async (event) => {
    logger.info(`[FraudConsumer] Analyzing payment: ${event.paymentId} amount: $${event.amount}`);

    const triggeredRules = FRAUD_RULES
      .map((rule) => ({ rule: rule.name, ...rule.check(event) }))
      .filter((r) => r.triggered);

    if (triggeredRules.length === 0) {
      logger.info(`[FraudConsumer] Payment ${event.paymentId} — CLEAN`);
      return;
    }

    // Aggregate risk score (max of individual scores)
    const riskScore = Math.min(Math.max(...triggeredRules.map((r) => r.score)), 1.0);
    const reason = triggeredRules.map((r) => r.reason).join('; ');

    logger.warn(`[FraudConsumer] FRAUD DETECTED on ${event.paymentId} — score: ${riskScore.toFixed(2)}`);

    // Save to DB
    const alert = await prisma.fraudAlert.create({
      data: {
        transactionId: event.paymentId,
        userId: event.userId,
        reason,
        riskScore,
        status: 'OPEN',
      },
    });

    // Publish fraud.detected event
    const fraudEvent: FraudDetectedEvent = {
      alertId: alert.id,
      transactionId: event.paymentId,
      userId: event.userId,
      reason,
      riskScore,
      timestamp: new Date().toISOString(),
    };
    await producer.publish(Topics.FRAUD_DETECTED, fraudEvent);
  });

  logger.info('[FraudConsumer] Listening on: payment.completed');

  const shutdown = async () => { await consumer.disconnect(); await producer.disconnect(); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
