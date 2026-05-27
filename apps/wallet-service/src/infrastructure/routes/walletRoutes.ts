import { Router } from 'express';
import { WalletController } from '../controllers/walletController';

const router = Router();
const ctrl = new WalletController();

router.post('/',                   (req, res) => ctrl.create(req, res));
router.get('/user/:userId',        (req, res) => ctrl.getByUser(req, res));
router.get('/:walletId',           (req, res) => ctrl.getById(req, res));
router.post('/:walletId/deposit',  (req, res) => ctrl.deposit(req, res));
router.post('/:walletId/withdraw', (req, res) => ctrl.withdraw(req, res));
router.post('/transfer',           (req, res) => ctrl.transfer(req, res));
router.get('/:walletId/ledger',    (req, res) => ctrl.getLedger(req, res));

export default router;
