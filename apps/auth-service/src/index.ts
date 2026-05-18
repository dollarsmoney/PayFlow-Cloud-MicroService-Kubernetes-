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
  console.log(`Auth Service running on port ${PORT}`);
});
