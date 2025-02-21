import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'https://frontend-q1t-main-tomas-projects-9383cbd1.vercel.app',
  'https://forms-onboarding.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', notificationsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 