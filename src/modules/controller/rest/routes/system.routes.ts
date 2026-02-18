import { Router, Request, Response, NextFunction } from 'express';
import { SystemService } from '@/modules/service/system.service';
import {
  authenticate,
  AuthenticatedRequest,
} from '@/modules/controller/rest/middleware/auth.middleware';
import { UnauthorizedError } from '@/shared/errors';

export const systemRoutes = Router();

const systemService = new SystemService();

systemRoutes.get(
  '/stats',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.permission < 5) {
        throw new UnauthorizedError('Admin access required');
      }

      const stats = await systemService.getStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },
);
