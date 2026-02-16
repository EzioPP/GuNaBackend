import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { UnauthorizedError } from '@/shared/errors';

export type AuthenticatedRequest = Request & {
  user?: {
    userId: number;
    permission: number;
  };
};

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError();

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) throw new UnauthorizedError();

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedError();

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    if (payload.userId === undefined || payload.permission === undefined) {
      throw new UnauthorizedError();
    }

    req.user = {
      userId: Number(payload.userId),
      permission: Number(payload.permission),
    };

    next();
  } catch (_error) {
    next(new UnauthorizedError());
  }
};
