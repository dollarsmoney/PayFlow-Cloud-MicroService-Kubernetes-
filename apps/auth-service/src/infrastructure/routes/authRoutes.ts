import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/signup', (req, res) => authController.signup(req, res));
router.post('/login',  (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/verify',  (req, res) => authController.verify(req, res));

export default router;
