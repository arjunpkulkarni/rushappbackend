import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/leaderboard?campusId=UUID&limit=50
// If campusId is missing or has no users, fall back to all users so the UI always has content
router.get('/', async (req, res) => {
  const { campusId, limit = 50 } = req.query;

  try {
    let users = [] as Array<any>;

    if (campusId) {
      users = await prisma.user.findMany({
        where: { campusId: campusId as string },
        include: { submissions: { select: { pointsAwarded: true } } },
      });
    }

    // Fallback: show all users if no campus provided or empty campus
    if (!campusId || users.length === 0) {
      users = await prisma.user.findMany({
        include: { submissions: { select: { pointsAwarded: true } } },
      });
    }

    const leaderboard = users.map((user) => {
      const score = user.submissions.reduce((acc: number, sub: any) => acc + (sub.pointsAwarded || 0), 0);
      return {
        id: user.id,
        name: user.username && user.username.length > 10 ? `${user.username.substring(0, 10)}...` : (user.username || user.name || 'User'),
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

