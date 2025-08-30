"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_1 = require("../app");
const router = (0, express_1.Router)();
// POST /api/v1/campus
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Campus name is required' });
    }
    try {
        const campus = await app_1.prisma.campus.create({
            data: {
                name,
            },
        });
        res.status(201).json(campus);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create campus' });
    }
});
// GET /api/v1/campus
router.get('/', async (req, res) => {
    try {
        const campuses = await app_1.prisma.campus.findMany();
        res.json(campuses);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch campuses' });
    }
});
exports.default = router;
