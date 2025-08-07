import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// POST /api/v1/campus
router.post('/', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Campus name is required' });
    }

    try {
        const campus = await prisma.campus.create({
            data: {
                name,
            },
        });
        res.status(201).json(campus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create campus' });
    }
});

// GET /api/v1/campus
router.get('/', async (req, res) => {
    try {
        const campuses = await prisma.campus.findMany();
        res.json(campuses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campuses' });
    }
});

export default router;
