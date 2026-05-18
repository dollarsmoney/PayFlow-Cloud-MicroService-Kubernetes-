import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (req, res) => res.send('transaction-history-service OK'));

app.listen(PORT, () => {
  console.log(`transaction-history-service running on port ${PORT}`);
});
