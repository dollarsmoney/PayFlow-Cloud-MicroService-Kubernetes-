import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Proxy routes
app.use('/api/auth', createProxyMiddleware({ target: 'http://auth-service:3001', changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: 'http://user-service:3002', changeOrigin: true }));
app.use('/api/wallets', createProxyMiddleware({ target: 'http://wallet-service:3003', changeOrigin: true }));
app.use('/api/payments', createProxyMiddleware({ target: 'http://payment-service:8080', changeOrigin: true }));

app.get('/health', (req, res) => res.send('API Gateway OK'));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
