const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

// Root files
write('pnpm-workspace.yaml', `
packages:
  - 'apps/*'
  - 'packages/*'
`);

write('package.json', JSON.stringify({
  name: "payflow-monorepo",
  version: "1.0.0",
  private: true,
  scripts: {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  devDependencies: {
    "turbo": "^1.10.15",
    "typescript": "^5.2.2"
  }
}, null, 2));

write('docker-compose.yml', `
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: payflow
      POSTGRES_PASSWORD: password
      POSTGRES_DB: payflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U payflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.2
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.3.2
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  postgres_data:
`);

write('Makefile', `
.PHONY: dev build test up down

up:
	docker-compose up -d

down:
	docker-compose down

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test
`);

write('README.md', `
# PayFlow - Production-grade Fintech Payment Platform

PayFlow is a microservices-based, scalable, and event-driven payment platform.

## Architecture
- **API Gateway**: Entry point for clients.
- **Auth Service**: JWT, RBAC, session management.
- **User Service**: User profiles, KYC.
- **Wallet Service**: Ledger, deposit, withdraw, transfer.
- **Payment Service (Golang)**: Payment processing, webhook handling, settlement.
- **Fraud Detection Service**: Suspicious transaction detection.
- **Notification Service**: Emails, SMS, push notifications.
- **Transaction History Service**: CQRS pattern for fast transaction lookup.

## Tech Stack
- Frontend: Next.js, TypeScript, TailwindCSS
- Backend: Node.js (TypeScript), Golang
- Databases: PostgreSQL, Redis
- Messaging: Kafka
`);

write('architecture.md', `
# PayFlow Architecture

\`\`\`mermaid
graph TD
    Client[Web/Mobile Client] --> APIGateway[API Gateway]
    APIGateway --> Auth[Auth Service]
    APIGateway --> User[User Service]
    APIGateway --> Wallet[Wallet Service]
    APIGateway --> Payment[Payment Service - Go]
    APIGateway --> History[Transaction History Service]
    
    Auth --> DB_Auth[(Auth DB)]
    User --> DB_User[(User DB)]
    Wallet --> DB_Wallet[(Wallet DB)]
    Payment --> DB_Payment[(Payment DB)]
    History --> DB_History[(Read Replica / History DB)]

    Payment --> Kafka[(Apache Kafka)]
    Wallet --> Kafka
    User --> Kafka
    Auth --> Kafka

    Kafka --> Fraud[Fraud Detection Service]
    Kafka --> Notification[Notification Service]
    Kafka --> History
\`\`\`
`);

console.log('Root files generated.');
