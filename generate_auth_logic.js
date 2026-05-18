const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('apps/auth-service/src/infrastructure/routes/authRoutes.ts', `
import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/signup', (req, res) => authController.signup(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));

export default router;
`);

write('apps/auth-service/src/infrastructure/controllers/authController.ts', `
import { Request, Response } from 'express';
import { AuthService } from '../../application/services/authService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async signup(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await this.authService.signup(email, password);
      res.status(201).json({ message: 'User created', userId: user.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const tokens = await this.authService.login(email, password);
      res.status(200).json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async refresh(req: Request, res: Response) {
    // Implement token refresh
    res.status(200).json({ message: 'Token refreshed' });
  }
}
`);

write('apps/auth-service/src/application/services/authService.ts', `
import { prisma } from '@payflow/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'super-secret';

  async signup(email: string, password: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'USER' }
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign({ userId: user.id, role: user.role }, this.jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, this.jwtSecret, { expiresIn: '7d' });

    return { token, refreshToken };
  }
}
`);

write('apps/auth-service/src/index.ts', `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './infrastructure/routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/api/v1/auth', authRoutes);

app.get('/health', (req, res) => res.send('Auth Service OK'));

app.listen(PORT, () => {
  console.log(\`Auth Service running on port \${PORT}\`);
});
`);

write('apps/auth-service/package.json', JSON.stringify({
  name: "auth-service",
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
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "@payflow/db": "workspace:*"
  },
  devDependencies: {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.2",
    "typescript": "^5.2.2",
    "ts-node-dev": "^2.0.0"
  }
}, null, 2));

console.log('Auth service logic generated.');
