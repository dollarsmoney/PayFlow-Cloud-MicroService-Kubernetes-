import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// GET /api/v1/users
router.get('/', (req, res) => userController.listUsers(req, res));

// GET /api/v1/users/:userId/profile
router.get('/:userId/profile', (req, res) => userController.getProfile(req, res));

// PATCH /api/v1/users/:userId/profile
router.patch('/:userId/profile', (req, res) => userController.updateProfile(req, res));

// PATCH /api/v1/users/:userId/kyc
router.patch('/:userId/kyc', (req, res) => userController.updateKyc(req, res));

export default router;
