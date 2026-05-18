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
