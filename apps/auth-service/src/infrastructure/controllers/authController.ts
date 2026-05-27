import { Request, Response } from 'express';
import { AuthService } from '../../application/services/authService';

const authService = new AuthService();

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
      }
      const result = await authService.signup(email, password, name);
      res.status(201).json({ message: 'User created successfully', ...result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
      }
      const result = await authService.login(email, password);
      // Normalise: expose accessToken so clients don't need to know internal field name
      res.status(200).json({ ...result, accessToken: result.token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required' });
      }
      const tokens = await authService.refresh(refreshToken);
      res.status(200).json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const token = req.headers.authorization?.split(' ')[1] || '';
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      await authService.logout(userId, token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });
      const payload = await authService.verifyToken(token);
      res.status(200).json({ valid: true, ...payload });
    } catch (error: any) {
      res.status(401).json({ valid: false, error: error.message });
    }
  }
}
