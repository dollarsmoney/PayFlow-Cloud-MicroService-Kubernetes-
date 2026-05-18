import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (req, res) => res.send('fraud-detection-service OK'));

app.listen(PORT, () => {
  console.log(`fraud-detection-service running on port ${PORT}`);
});
