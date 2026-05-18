const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

const services = [
  'api-gateway',
  'auth-service',
  'user-service',
  'wallet-service',
  'notification-service',
  'fraud-detection-service',
  'transaction-history-service'
];

services.forEach(service => {
  const isGateway = service === 'api-gateway';
  const port = {
    'api-gateway': 3000,
    'auth-service': 3001,
    'user-service': 3002,
    'wallet-service': 3003,
    'notification-service': 3004,
    'fraud-detection-service': 3005,
    'transaction-history-service': 3006
  }[service];

  write(`apps/${service}/package.json`, JSON.stringify({
    name: service,
    version: "1.0.0",
    scripts: {
      "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js"
    },
    dependencies: {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "helmet": "^7.0.0",
      "dotenv": "^16.3.1",
      ...(isGateway ? { "http-proxy-middleware": "^2.0.6" } : {}),
      ...(!isGateway ? { "@payflow/db": "workspace:*", "@payflow/events": "workspace:*" } : {})
    },
    devDependencies: {
      "@types/express": "^4.17.17",
      "@types/cors": "^2.8.13",
      "typescript": "^5.2.2",
      "ts-node-dev": "^2.0.0"
    }
  }, null, 2));

  write(`apps/${service}/tsconfig.json`, JSON.stringify({
    compilerOptions: {
      target: "es2022",
      module: "commonjs",
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true
    },
    include: ["src/**/*"]
  }, null, 2));

  write(`apps/${service}/Dockerfile`, `
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --production
CMD ["npm", "start"]
EXPOSE ${port}
`);

  if (isGateway) {
    write(`apps/${service}/src/index.ts`, `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || ${port};

app.use(cors());
app.use(helmet());

// Logging middleware
app.use((req, res, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  next();
});

// Proxy routes
app.use('/api/auth', createProxyMiddleware({ target: 'http://auth-service:3001', changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: 'http://user-service:3002', changeOrigin: true }));
app.use('/api/wallets', createProxyMiddleware({ target: 'http://wallet-service:3003', changeOrigin: true }));
app.use('/api/payments', createProxyMiddleware({ target: 'http://payment-service:8080', changeOrigin: true }));

app.get('/health', (req, res) => res.send('API Gateway OK'));

app.listen(PORT, () => {
  console.log(\`API Gateway running on port \${PORT}\`);
});
`);
  } else {
    write(`apps/${service}/src/index.ts`, `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || ${port};

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (req, res) => res.send('${service} OK'));

app.listen(PORT, () => {
  console.log(\`${service} running on port \${PORT}\`);
});
`);
  }
});

console.log('Node services generated.');
