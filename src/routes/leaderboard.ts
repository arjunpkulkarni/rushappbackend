import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/leaderboard?campusId=UUID&type=(daily|weekly)&limit=50
router.get('/', async (req, res) => {
    const { campusId, limit = 50 } = req.query;

    if (!campusId) {
        return res.status(400).json({ error: 'Campus ID is required' });
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                campusId: campusId as string,
            },
            include: {
                submissions: {
                    select: {
                        pointsAwarded: true,
                    },
                },
            },
        });

        const leaderboard = users.map(user => {
            const score = user.submissions.reduce((acc, sub) => acc + (sub.pointsAwarded || 0), 0);
            return {
                id: user.id,
                name: user.username.length > 10 ? `${user.username.substring(0, 10)}...` : user.username,
                score,
                avatar: user.profileImage || `https://i.pravatar.cc/150?u=${user.id}`,
            };
        });

        leaderboard.sort((a, b) => b.score - a.score);
        
        const rankedLeaderboard = leaderboard.slice(0, Number(limit)).map((user, index) => ({
            ...user,
            rank: index + 1,
        }));

        res.json(rankedLeaderboard);
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

