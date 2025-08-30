"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_1 = require("../app");
const router = (0, express_1.Router)();
// GET /api/v1/challenges?campus=UUID
router.get('/', async (req, res) => {
    try {
        const challenges = await app_1.prisma.challenge.findMany();
        res.json(challenges);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});
// GET /api/v1/challenges/featured?campus=UUID
router.get('/featured', async (req, res) => {
    try {
        const featuredChallenge = await app_1.prisma.challenge.findFirst({
            where: {
                isBonus: true,
            },
        });
        res.json(featuredChallenge);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured challenge' });
    }
});
// GET /api/v1/challenges/:id/stats - live stats for a challenge
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const total = await app_1.prisma.submission.count({ where: { challengeId: id, verified: true } });
        res.json({ verifiedCount: total });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenge stats' });
    }
});
// POST /api/v1/challenges
router.post('/', async (req, res) => {
    const { campusId, title, description, hint, mediaUrl, scheduledAt, expiresAt, isBonus, } = req.body;
    try {
        const newChallenge = await app_1.prisma.challenge.create({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create challenge' });
    }
});
exports.default = router;
