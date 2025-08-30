"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_1 = require("../app");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/submissions';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
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
router.post('/', auth_1.protect, upload.single('video'), async (req, res) => {
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
        const challenge = await app_1.prisma.challenge.findUnique({
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
        const existingSubmission = await app_1.prisma.submission.findFirst({
            where: {
                userId,
                challengeId
            }
        });
        if (existingSubmission) {
            console.log('Submissions: duplicate submission', { userId, challengeId });
            return res.status(400).json({ error: 'You have already submitted for this challenge' });
        }
        // Enforce buy-in: must have buy-in for the day BEFORE the challenge date to play tomorrow's challenge
        // Determine challenge day in UTC
        const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const challengeDayUtc = startOfUtcDay(new Date());
        const yesterdayUtc = new Date(challengeDayUtc.getTime() - 24 * 60 * 60 * 1000);
        const hadBuyIn = await app_1.prisma.buyIn.findUnique({
            where: { userId_campusId_date: { userId, campusId, date: yesterdayUtc } }
        });
        if (!hadBuyIn) {
            return res.status(403).json({ error: 'Buy-in required before midnight to participate' });
        }
        // Create the submission
        const mediaUrl = `/uploads/submissions/${req.file.filename}`;
        const submission = await app_1.prisma.submission.create({
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
    }
    catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});
// GET /api/v1/submissions/feed/:campusId - Get submissions feed for a campus
router.get('/feed/:campusId', async (req, res) => {
    try {
        const { campusId } = req.params;
        const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 50);
        const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
        const submissions = await app_1.prisma.submission.findMany({
            where: { campusId },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            include: {
                user: { select: { id: true, username: true, name: true, profileImage: true } },
                challenge: { select: { id: true, title: true, description: true } },
            },
        });
        let nextCursor = undefined;
        if (submissions.length > limit) {
            const nextItem = submissions.pop();
            nextCursor = nextItem?.id;
        }
        res.json({ items: submissions, nextCursor });
    }
    catch (e) {
        console.error('Feed error', e);
        res.status(500).json({ error: 'Failed to load feed' });
    }
});
exports.default = router;
