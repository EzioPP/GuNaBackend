import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
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

      let record;
      try {
        record = await fileFactory.createFile({
          filename: uploadedFile.originalname,
          path: path.join('uploads', uploadedFile.filename),
          size: uploadedFile.size,
          is_public: isPublic,
          user_id: req.user.userId,
        });
      } catch (err) {
        try {
          await fsPromises.unlink(path.join(uploadDir, uploadedFile.filename));
        } catch {
          // file may already be gone
        }
        throw err;
      }

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  },
);

fileRoutes.get(
  '/usage',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ValidationError('User context missing');

      const usage = await fileFactory.getStorageUsage(req.user.userId);
      res.status(200).json({ usage });
    } catch (error) {
      next(error);
    }
  },
);

fileRoutes.get(
  '/myfiles',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ValidationError('User context missing');

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string, 10) || 20));

      const result = await fileFactory.getUserFilesPaginated(req.user.userId, page, pageSize);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

fileRoutes.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ValidationError('User context missing');

      const fileId = parseInt(req.params.id as string, 10);
      if (isNaN(fileId)) throw new ValidationError('Invalid file ID');

      const fileRecord = await fileFactory.getFileByIdUser(fileId, req.user.userId);
      const filePath = path.join(uploadDir, path.basename(fileRecord.path));
      const stat = await fsPromises.stat(filePath);
      const fileSize = stat.size;

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
          return;
        }

        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileRecord.filename)}"`,
        });

        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.status(200).set({
          'Content-Length': String(fileSize),
          'Accept-Ranges': 'bytes',
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileRecord.filename)}"`,
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
    } catch (error) {
      next(error);
    }
  },
);

fileRoutes.patch(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ValidationError('User context missing');

      const fileId = parseInt(req.params.id as string, 10);
      if (isNaN(fileId)) throw new ValidationError('Invalid file ID');

      const { filename, is_public } = req.body ?? {};
      if (filename === undefined && is_public === undefined) {
        throw new ValidationError('Nothing to update — provide filename or is_public');
      }

      const input: { filename?: string; is_public?: boolean } = {};
      if (typeof filename === 'string' && filename.trim().length > 0) {
        input.filename = filename.trim();
      }
      if (is_public !== undefined) {
        input.is_public = String(is_public).toLowerCase() === 'true';
      }

      const updated = await fileFactory.updateFile(fileId, req.user.userId, input);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },
);

fileRoutes.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ValidationError('User context missing');

      const fileId = parseInt(req.params.id as string, 10);
      if (isNaN(fileId)) throw new ValidationError('Invalid file ID');

      await fileFactory.deleteFile(fileId, req.user.userId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);
