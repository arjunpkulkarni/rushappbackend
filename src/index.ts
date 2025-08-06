import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

export const prisma = new PrismaClient().$extends(withAccelerate());

app.get('/', (req: Request, res: Response) => {
  res.send('Rush App Backend is running!');
});

// Import and use routes
import challengeRoutes from './routes/challenges';
import leaderboardRoutes from './routes/leaderboard';
// The submissions feed is under the campus route context
import submissionRoutes from './routes/submissions';
import userRoutes from './routes/users';

app.use('/api/v1/challenges', challengeRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/campus', submissionRoutes); 
app.use('/api/v1/users', userRoutes);


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
