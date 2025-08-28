import { Router } from 'express';
import { prisma } from '../app';
import { protect, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/submissions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept all files; validate later if needed
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// POST /api/v1/submissions - Submit proof for a challenge
router.post('/', protect, upload.single('video'), async (req: AuthRequest, res) => {
  try {
    const { challengeId, campusId } = req.body;
    const userId = req.user?.id;

    console.log('POST /api/v1/submissions', {
      contentType: req.headers['content-type'],
      body: { challengeId, campusId },
      userId,
      hasFile: !!req.file,
      fileField: req.file?.fieldname,
      fileMimetype: req.file?.mimetype,
      fileSize: req.file?.size,
    });

    // Validate user authentication
    if (!userId) {
      console.log('Submissions: user not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate required fields
    if (!challengeId || !campusId) {
      console.log('Submissions: missing fields', { challengeId, campusId });
      return res.status(400).json({ error: 'challengeId and campusId are required' });
    }

    if (!req.file) {
      console.log('Submissions: no file received', { contentType: req.headers['content-type'] });
      return res.status(400).json({ error: 'Video file is required' });
    }

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      console.log('Submissions: challenge not found', { challengeId });
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (new Date() > challenge.expiresAt) {
      console.log('Submissions: challenge expired', { expiresAt: challenge.expiresAt });
      return res.status(400).json({ error: 'Challenge has expired' });
    }

    // Check if user already submitted for this challenge
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId,
        challengeId
      }
    });

    if (existingSubmission) {
      console.log('Submissions: duplicate submission', { userId, challengeId });
      return res.status(400).json({ error: 'You have already submitted for this challenge' });
    }

    // Create the submission
    const mediaUrl = `/uploads/submissions/${req.file.filename}`;
    
    const submission = await prisma.submission.create({
      data: {
        userId,
        challengeId,
        campusId,
        mediaUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        },
        challenge: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });

    console.log('Submissions: created', { submissionId: submission.id });
    res.status(201).json({
      message: 'Submission created successfully',
      submission
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// GET /api/v1/submissions/feed/:campusId - Get submissions feed for a campus
router.get('/feed/:campusId', (req, res) => {
    const { campusId } = req.params;
    const { limit, cursor } = req.query;
    res.json({ message: `TODO: Fetch feed for campus ${campusId} with limit ${limit} and cursor ${cursor}` });
});

export default router;
