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
