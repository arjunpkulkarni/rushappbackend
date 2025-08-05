import { Router } from 'express';

const router = Router();

// GET /api/v1/users/{user_id}/profile
router.get('/:userId/profile', (req, res) => {
    const { userId } = req.params;
    res.json({ message: `TODO: Fetch profile for user ${userId}` });
});

export default router;
