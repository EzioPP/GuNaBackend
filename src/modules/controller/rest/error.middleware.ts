import { NextFunction, Request, Response } from 'express';
import { AppError } from '@/shared/errors';
import logger from '@/shared/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  logger.error(err);
  if (err.stack) {
    console.error(err.stack);
  }
  const response: { error: { code: string; message: string; stack?: string } } = {
    error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' },
  };

  res.status(500).json(response);
};
