import { Router, Request, Response } from 'express';

export const gurozordRoutes = Router();

const GUROZORD_BASE = process.env.GUROZORD_URL || 'http://localhost:3001';

async function proxyToGurozord(
  req: Request,
  res: Response,
  targetPath: string,
) {
  const url = `${GUROZORD_BASE}${targetPath}`;

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

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({
      success: false,
      error: 'Failed to reach gurozord service',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

gurozordRoutes.get('/groups', (req, res) =>
  proxyToGurozord(req, res, '/dashboard/groups'),
);

gurozordRoutes.get('/groups/:groupId', (req, res) =>
  proxyToGurozord(req, res, `/dashboard/groups/${req.params.groupId}`),
);

gurozordRoutes.get('/groups/:groupId/members', (req, res) =>
  proxyToGurozord(req, res, `/dashboard/groups/${req.params.groupId}/members`),
);

gurozordRoutes.post('/groups/:groupId/open', (req, res) =>
  proxyToGurozord(req, res, `/dashboard/groups/${req.params.groupId}/open`),
);


gurozordRoutes.post('/groups/:groupId/close', (req, res) =>
  proxyToGurozord(req, res, `/dashboard/groups/${req.params.groupId}/close`),
);


gurozordRoutes.put('/groups/:groupId/times', (req, res) =>
  proxyToGurozord(req, res, `/dashboard/groups/${req.params.groupId}/times`),
);


gurozordRoutes.get('/health', (req, res) =>
  proxyToGurozord(req, res, '/dashboard/health'),
);
