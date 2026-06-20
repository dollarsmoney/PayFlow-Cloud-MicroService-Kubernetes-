# PayFlow API Documentation

## Auth Service
`POST /api/v1/auth/signup`
- Body: `{ "email": "user@example.com", "password": "password123" }`
- Response: `201 Created`

`POST /api/v1/auth/login`
- Body: `{ "email": "user@example.com", "password": "password123" }`
- Response: `200 OK` `{ "token": "...", "refreshToken": "..." }`

## Wallet Service
`POST /api/v1/wallets/create`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "userId": "uuid", "currency": "USD" }`
- Response: `201 Created`

`GET /api/v1/wallets/:userId/balance`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` `[{ "id": "...", "balance": 1000.00, "currency": "USD" }]`

## Payment Service
`POST /api/v1/payments/process`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "userId": "uuid", "amount": 100.50, "currency": "USD" }`
- Response: `202 Accepted`

`GET /api/v1/payments/:id/status`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` `{ "id": "uuid", "status": "COMPLETED" }`
