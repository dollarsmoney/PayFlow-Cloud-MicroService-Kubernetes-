import { Kafka, Producer, Consumer, logLevel, EachMessagePayload } from 'kafkajs';

// ============================================================
// TOPICS
// ============================================================
export enum Topics {
  USER_CREATED = 'user.created',
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  WALLET_UPDATED = 'wallet.updated',
  FRAUD_DETECTED = 'fraud.detected',
  NOTIFICATION_SEND = 'notification.send',
}

// ============================================================
// EVENT INTERFACES
// ============================================================
export interface UserCreatedEvent {
  userId: string;
  email: string;
  timestamp: string;
}

export interface PaymentInitiatedEvent {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface PaymentCompletedEvent {
  paymentId: string;
  userId: string;
  walletId?: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface PaymentFailedEvent {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  reason: string;
  timestamp: string;
}

export interface WalletUpdatedEvent {
  walletId: string;
  userId: string;
  newBalance: number;
  currency: string;
  operation: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEBIT';
  referenceId?: string;
  timestamp: string;
}

export interface FraudDetectedEvent {
  alertId: string;
  transactionId: string;
  userId: string;
  reason: string;
  riskScore: number;
  timestamp: string;
}

export interface NotificationEvent {
  userId: string;
  type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'FRAUD_ALERT' | 'WELCOME' | 'WALLET_UPDATE';
  title: string;
  message: string;
  timestamp: string;
}

// ============================================================
// KAFKA CLIENT FACTORY
// ============================================================
let kafkaInstance: Kafka | null = null;

export function getKafkaClient(clientId: string = 'payflow-service'): Kafka {
  if (!kafkaInstance) {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    kafkaInstance = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
    });
  }
  return kafkaInstance!;
}

// ============================================================
// PRODUCER HELPER
// ============================================================
export class KafkaProducer {
  private producer: Producer;
  private connected = false;

  constructor(clientId?: string) {
    this.producer = getKafkaClient(clientId).producer({
      allowAutoTopicCreation: true,
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }

  async publish<T>(topic: Topics, event: T): Promise<void> {
    await this.connect();
    await this.producer.send({
      topic,
      messages: [
        {
          key: String((event as any).userId || (event as any).paymentId || Date.now()),
          value: JSON.stringify(event),
          headers: {
            'content-type': 'application/json',
            'produced-at': new Date().toISOString(),
          },
        },
      ],
    });
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }
}

// ============================================================
// CONSUMER HELPER
// ============================================================
export type MessageHandler<T> = (event: T, raw: EachMessagePayload) => Promise<void>;

export class KafkaConsumer {
  private consumer: Consumer;
  private connected = false;

  constructor(groupId: string, clientId?: string) {
    this.consumer = getKafkaClient(clientId).consumer({
      groupId,
      retry: { retries: 5 },
    });
  }

  async subscribe(topics: Topics[]): Promise<void> {
    if (!this.connected) {
      await this.consumer.connect();
      this.connected = true;
    }
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
  }

  async run<T>(handler: MessageHandler<T>): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload) => {
        const { topic, partition, message } = payload;
        if (!message.value) return;
        try {
          const event: T = JSON.parse(message.value.toString());
          await handler(event, payload);
        } catch (err) {
          console.error(`[KafkaConsumer] Failed to process message on ${topic}[${partition}]:`, err);
          throw err; // Re-throw to trigger KafkaJS retries and prevent data loss
        }
      },
    });
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.consumer.disconnect();
      this.connected = false;
    }
  }
}
