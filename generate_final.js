const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('.env.example', `
# Global Services
DATABASE_URL="postgresql://payflow:password@localhost:5432/payflow?schema=public"
REDIS_URL="redis://localhost:6379"
KAFKA_BROKERS="localhost:9092"

# API Gateway
PORT=3000

# Auth Service
AUTH_SERVICE_PORT=3001
JWT_SECRET="super-secret-production-key-change-me"
JWT_REFRESH_SECRET="super-secret-refresh-key-change-me"

# User Service
USER_SERVICE_PORT=3002

# Wallet Service
WALLET_SERVICE_PORT=3003

# Payment Service (Go)
PAYMENT_SERVICE_PORT=8080

# Notification Service
NOTIFICATION_SERVICE_PORT=3004

# Fraud Detection Service
FRAUD_SERVICE_PORT=3005

# Transaction History Service
HISTORY_SERVICE_PORT=3006
`);

write('packages/db-prisma/prisma/seed.ts', `
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@payflow.com',
      passwordHash,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          kycStatus: 'APPROVED'
        }
      },
      wallets: {
        create: [
          { currency: 'USD', balance: 100000.00 },
          { currency: 'EUR', balance: 50000.00 }
        ]
      }
    }
  });

  console.log('Created Admin User:', user.email);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`);

write('docs/API.md', `
# PayFlow API Documentation

## Auth Service
\`POST /api/v1/auth/signup\`
- Body: \`{ "email": "user@example.com", "password": "password123" }\`
- Response: \`201 Created\`

\`POST /api/v1/auth/login\`
- Body: \`{ "email": "user@example.com", "password": "password123" }\`
- Response: \`200 OK\` \`{ "token": "...", "refreshToken": "..." }\`

## Wallet Service
\`POST /api/v1/wallets/create\`
- Headers: \`Authorization: Bearer <token>\`
- Body: \`{ "userId": "uuid", "currency": "USD" }\`
- Response: \`201 Created\`

\`GET /api/v1/wallets/:userId/balance\`
- Headers: \`Authorization: Bearer <token>\`
- Response: \`200 OK\` \`[{ "id": "...", "balance": 1000.00, "currency": "USD" }]\`

## Payment Service
\`POST /api/v1/payments/process\`
- Headers: \`Authorization: Bearer <token>\`
- Body: \`{ "userId": "uuid", "amount": 100.50, "currency": "USD" }\`
- Response: \`202 Accepted\`

\`GET /api/v1/payments/:id/status\`
- Headers: \`Authorization: Bearer <token>\`
- Response: \`200 OK\` \`{ "id": "uuid", "status": "COMPLETED" }\`
`);

console.log('Final files generated.');
