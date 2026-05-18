const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('packages/db-prisma/package.json', JSON.stringify({
  name: "@payflow/db",
  version: "1.0.0",
  main: "dist/index.js",
  types: "dist/index.d.ts",
  scripts: {
    "build": "tsc",
    "generate": "prisma generate"
  },
  dependencies: {
    "@prisma/client": "^5.3.1"
  },
  devDependencies: {
    "prisma": "^5.3.1",
    "typescript": "^5.2.2"
  }
}, null, 2));

write('packages/db-prisma/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: "es2022",
    module: "commonjs",
    declaration: true,
    outDir: "./dist",
    strict: true
  },
  include: ["src/**/*"]
}, null, 2));

write('packages/db-prisma/prisma/schema.prisma', `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Auth & User Service
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          String    @default("USER")
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  profile       UserProfile?
  wallets       Wallet[]
}

model UserProfile {
  id            String    @id @default(uuid())
  userId        String    @unique
  firstName     String
  lastName      String
  kycStatus     String    @default("PENDING") // PENDING, APPROVED, REJECTED
  address       String?
  city          String?
  country       String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Wallet Service
model Wallet {
  id            String    @id @default(uuid())
  userId        String
  currency      String    @default("USD")
  balance       Decimal   @default(0.00)
  lockedBalance Decimal   @default(0.00)
  status        String    @default("ACTIVE") // ACTIVE, FROZEN
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  transactions  Ledger[]
}

model Ledger {
  id            String    @id @default(uuid())
  walletId      String
  type          String    // DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT
  amount        Decimal
  currency      String
  referenceId   String?   // External reference or internal payment ID
  status        String    // PENDING, COMPLETED, FAILED
  createdAt     DateTime  @default(now())

  wallet        Wallet    @relation(fields: [walletId], references: [id])
}

// Fraud Service
model FraudAlert {
  id            String    @id @default(uuid())
  transactionId String
  userId        String
  reason        String
  riskScore     Float
  status        String    @default("OPEN") // OPEN, RESOLVED
  createdAt     DateTime  @default(now())
}
`);

write('packages/db-prisma/src/index.ts', `
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`);

write('packages/event-contracts/package.json', JSON.stringify({
  name: "@payflow/events",
  version: "1.0.0",
  main: "dist/index.js",
  types: "dist/index.d.ts",
  scripts: {
    "build": "tsc"
  },
  dependencies: {
    "kafkajs": "^2.2.4"
  },
  devDependencies: {
    "typescript": "^5.2.2"
  }
}, null, 2));

write('packages/event-contracts/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: "es2022",
    module: "commonjs",
    declaration: true,
    outDir: "./dist",
    strict: true
  },
  include: ["src/**/*"]
}, null, 2));

write('packages/event-contracts/src/index.ts', `
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
`);

console.log('Packages generated.');
