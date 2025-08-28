import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/leaderboard?campusId=UUID&limit=50&period=daily|weekly|monthly|overall
// If campusId is missing or has no users, fall back to all users so the UI always has content
router.get('/', async (req, res) => {
  const { campusId, limit = 50 } = req.query;
  const period = String((req.query as any).period || 'overall').toLowerCase();

  const now = new Date();
  let startDate: Date | undefined = undefined;
  if (period === 'daily') {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === 'weekly') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'monthly') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } // overall => no startDate filter

  try {
    let users = [] as Array<any>;

    if (campusId) {
      users = await prisma.user.findMany({
        where: { campusId: campusId as string },
        include: {
          submissions: {
            where: {
              verified: true,
              ...(startDate ? { OR: [ { verifiedAt: { gte: startDate } }, { createdAt: { gte: startDate } } ] } : {}),
            },
            select: { rank: true, verified: true, verifiedAt: true, createdAt: true },
          },
        },
      });
    }

    // Fallback: show all users if no campus provided or empty campus
    if (!campusId || users.length === 0) {
      users = await prisma.user.findMany({
        include: {
          submissions: {
            where: {
              verified: true,
              ...(startDate ? { OR: [ { verifiedAt: { gte: startDate } }, { createdAt: { gte: startDate } } ] } : {}),
            },
            select: { rank: true, verified: true, verifiedAt: true, createdAt: true },
          },
        },
      });
    }

    const leaderboard = users.map((user) => {
      const wins = (user.submissions || []).reduce((acc: number, sub: any) => {
        return acc + ((sub?.verified === true && sub?.rank === 1) ? 1 : 0);
      }, 0);
      return {
        id: user.id,
        name: user.username && user.username.length > 10 ? `${user.username.substring(0, 10)}...` : (user.username || user.name || 'User'),
        score: wins, // score is the number of wins (rank 1 verified submissions)
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

