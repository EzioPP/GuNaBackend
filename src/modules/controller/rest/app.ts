import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { fileRoutes } from './routes/file.routes';
import { systemRoutes } from './routes/system.routes';
import { gurozordRoutes } from './routes/gurozord.routes';
import { errorHandler } from './error.middleware';
import { authenticate } from './middleware/auth.middleware';

export const app = express();

const apiPrefix = process.env.API_PREFIX || '';

app.use(cors());
app.use(express.json());

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/files`, fileRoutes);
app.use(`${apiPrefix}/system`, systemRoutes);
app.use(`${apiPrefix}/dashboard`, authenticate, gurozordRoutes);

app.use(errorHandler);
