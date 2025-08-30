import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/media';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.includes('.') ? file.originalname.substring(file.originalname.lastIndexOf('.')) : '';
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/v1/media/upload  (field: image)
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const urlPath = `/uploads/media/${req.file.filename}`;
    const host = req.get('host');
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const absoluteUrl = `${proto}://${host}${urlPath}`;
    res.status(201).json({ url: urlPath, absoluteUrl, filename: req.file.filename });
  } catch (e) {
    console.error('Media upload error', e);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;



