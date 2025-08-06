import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET /api/v1/challenges?campus=UUID
router.get('/', async (req, res) => {
    try {
        const challenges = await prisma.challenge.findMany();
        res.json(challenges);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

// GET /api/v1/challenges/featured?campus=UUID
router.get('/featured', async (req, res) => {
    try {
        const featuredChallenge = await prisma.challenge.findFirst({
            where: {
                isBonus: true,
            },
        });
        res.json(featuredChallenge);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured challenge' });
    }
});

// POST /api/v1/challenges
router.post('/', async (req, res) => {
    const {
        campusId,
        title,
        description,
        hint,
        mediaUrl,
        scheduledAt,
        expiresAt,
        isBonus,
    } = req.body;

    try {
        const newChallenge = await prisma.challenge.create({
            data: {
                campusId,
                title,
                description,
                hint,
                mediaUrl,
                scheduledAt: new Date(scheduledAt),
                expiresAt: new Date(expiresAt),
                isBonus,
            },
        });
        res.status(201).json(newChallenge);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create challenge' });
    }
});

export default router;
