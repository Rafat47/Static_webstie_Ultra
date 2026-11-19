import app from './netlify/functions/app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Hair Care E-Commerce Backend running on port ${PORT}`);
  console.log(`📡 Local API endpoint: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

