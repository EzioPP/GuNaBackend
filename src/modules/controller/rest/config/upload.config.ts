import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/gzip',
  'application/x-tar',
  // Audio/Video
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'video/webm',
]);

const sanitizeFilename = (filename: string) => {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}-${safeName}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed`));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});
