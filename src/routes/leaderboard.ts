import { Router } from 'express';

const router = Router();

// GET /api/v1/leaderboard?campus=UUID&type=(daily|weekly)&limit=50
router.get('/', (req, res) => {
    const { campus, type, limit } = req.query;
    res.json({ message: `TODO: Fetch ${type} leaderboard for campus ${campus} with limit ${limit}` });
});

export default router;
