import { Router } from 'express';

const router = Router();

// GET /api/v1/challenges/today?campus=UUID
router.get('/today', (req, res) => {
    res.json({ message: 'TODO: Fetch today\'s challenge' });
});

// POST /api/v1/challenges/{challenge_id}/submit
router.post('/:challengeId/submit', (req, res) => {
    res.json({ message: 'TODO: Submit proof for a challenge' });
});


export default router;
