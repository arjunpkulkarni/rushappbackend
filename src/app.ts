import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import authRoutes from './routes/auth'; 

export const prisma = new PrismaClient();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', routes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;
