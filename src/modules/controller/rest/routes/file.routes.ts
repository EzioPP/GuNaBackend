import { Router, Response, NextFunction } from 'express';
import path from 'path';
import { fileFactory } from '@/modules/factory';
import {
  authenticate,
  AuthenticatedRequest,
} from '@/modules/controller/rest/middleware/auth.middleware';
import { ValidationError } from '@/shared/errors';
import { upload, uploadDir } from '@/modules/controller/rest/config/upload.config';

export const fileRoutes = Router();

fileRoutes.post(
  '/upload',
  	authenticate,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const uploadedFile = req.file;
      if (!uploadedFile) throw new ValidationError('File is required');
      			if (!req.user) throw new ValidationError('User context missing');

      const isPublic = String(req.body?.isPublic ?? 'false').toLowerCase() === 'true';

      const record = await fileFactory.createFile({
        filename: uploadedFile.originalname,
        path: path.join('uploads', uploadedFile.filename),
        size: uploadedFile.size,
        is_public: isPublic,
        user_id: req.user.userId,
      });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  },
);
