import { Request, Response } from 'express';
import { UserService } from '../../application/services/userService';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const profile = await userService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const profile = await userService.updateProfile(userId, req.body);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateKyc(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid KYC status' });
      }
      const profile = await userService.updateKycStatus(userId, status);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async listUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await userService.listUsers(page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
