import { Router, Request, Response, NextFunction } from 'express';
import { authFactory } from '@/modules/factory';

export const authRoutes = Router();

authRoutes.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  try {
    const result = await authFactory.login(username, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
