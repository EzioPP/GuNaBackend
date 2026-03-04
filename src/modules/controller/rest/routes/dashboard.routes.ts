import { Router, Request, Response } from 'express';

export const dashboardRoutes = Router();

const GUROZORD_BASE = process.env.GUROZORD_URL || 'http://localhost:3001';

/**
 * Proxy all dashboard requests to the gurozord service running on the same machine.
 * Forwards: GET, POST, PUT, DELETE, PATCH under /dashboard/*
 */
dashboardRoutes.all('/*', async (req: Request, res: Response) => {
  const targetUrl = `${GUROZORD_BASE}/dashboard${req.path === '/' ? '' : req.path}`;

  try {
    const headers: Record<string, string> = {
      'content-type': req.headers['content-type'] || 'application/json',
    };

    if (req.headers.authorization) {
      headers['authorization'] = req.headers.authorization;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({
      success: false,
      error: 'Failed to reach gurozord service',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
