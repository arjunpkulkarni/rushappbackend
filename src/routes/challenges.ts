import { Router } from 'express';
import { prisma } from '..';

const router = Router();

// GET /api/v1/challenges?campus=UUID
router.get('/', async (req, res) => {
    const { campus } = req.query;

    if (!campus) {
        return res.status(400).json({ error: 'Campus ID is required' });
    }

    try {
        const challenges = await prisma.challenge.findMany({
            where: {
                campusId: campus as string,
                scheduledAt: {
                    lte: new Date(),
                },
                expiresAt: {
                    gte: new Date(),
                },
            },
        });
        res.json(challenges);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

// GET /api/v1/challenges/featured?campus=UUID
router.get('/featured', async (req, res) => {
    const { campus } = req.query;

    if (!campus) {
        return res.status(400).json({ error: 'Campus ID is required' });
    }

    try {
        const featuredChallenge = await prisma.challenge.findFirst({
            where: {
                campusId: campus as string,
                isBonus: true,
                scheduledAt: {
                    lte: new Date(),
                },
                expiresAt: {
                    gte: new Date(),
                },
            },
        });
        res.json(featuredChallenge);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured challenge' });
    }
});

// POST /api/v1/challenges/{challenge_id}/submit
router.post('/:challengeId/submit', (req, res) => {
    res.json({ message: 'TODO: Submit proof for a challenge' });
});

export default router;