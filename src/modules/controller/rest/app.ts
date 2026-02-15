import express from 'express';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './error.middleware';

export const app = express();

app.use(express.json());

app.use('/auth', authRoutes);

app.use(errorHandler);