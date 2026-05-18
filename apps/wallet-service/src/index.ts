import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import walletRoutes from './infrastructure/routes/walletRoutes';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/api/v1/wallets', walletRoutes);

app.get('/health', (req, res) => res.send('Wallet Service OK'));

app.listen(PORT, () => {
  console.log(`Wallet Service running on port ${PORT}`);
});
