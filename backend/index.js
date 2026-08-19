import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'NAB Connect Backend API is running successfully',
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
