import { Router } from 'express';

const router = Router();

// GET /api/v1/campus/{campus}/feed?limit=20&cursor=…
router.get('/feed/:campusId', (req, res) => {
    const { campusId } = req.params;
    const { limit, cursor } = req.query;
    res.json({ message: `TODO: Fetch feed for campus ${campusId} with limit ${limit} and cursor ${cursor}` });
});


export default router;
