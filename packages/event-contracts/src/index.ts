export enum Topics {
  USER_CREATED = 'user.created',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  WALLET_UPDATED = 'wallet.updated',
  FRAUD_DETECTED = 'fraud.detected'
}

export interface UserCreatedEvent {
  userId: string;
  email: string;
  timestamp: string;
}

export interface PaymentCompletedEvent {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  timestamp: string;
}
