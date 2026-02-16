import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { fileRoutes } from './routes/file.routes';
import { errorHandler } from './error.middleware';

export const app = express();

const apiPrefix = '/api';

app.use(cors());
app.use(express.json());

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/files`, fileRoutes);

app.use(errorHandler);
