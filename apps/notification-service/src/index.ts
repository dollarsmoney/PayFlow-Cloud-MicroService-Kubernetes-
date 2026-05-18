import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (req, res) => res.send('notification-service OK'));

app.listen(PORT, () => {
  console.log(`notification-service running on port ${PORT}`);
});
