import { Router } from 'express';
import { WalletController } from '../controllers/walletController';

const router = Router();
const walletController = new WalletController();

router.post('/create', (req, res) => walletController.create(req, res));
router.get('/:userId/balance', (req, res) => walletController.getBalance(req, res));

export default router;
