import express from 'express';
import logger from '@/shared/logger';

const app = express();
app.use(express.json());

export default app;
