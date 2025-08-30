"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Normalize phone numbers to E.164 with US default
const normalizePhoneToE164 = (raw) => {
    if (!raw)
        return undefined;
    const trimmed = String(raw).trim();
    if (trimmed.startsWith('+'))
        return trimmed.replace(/\s+/g, '');
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 0)
        return undefined;
    if (digits.length === 10)
        return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1'))
        return `+${digits}`;
    return `+${digits}`;
};
router.get('/me', auth_1.protect, async (req, res) => {
    res.json(req.user);
});
router.post('/', async (req, res) => {
    const { name, username, password, phoneNumber, campusId } = req.body;
    if (!name || !username || !campusId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        let passwordHash = undefined;
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            passwordHash = await bcryptjs_1.default.hash(password, salt);
        }
        const normalizedPhone = normalizePhoneToE164(phoneNumber);
        const user = await prisma.user.create({
            data: {
                name,
                username,
                passwordHash,
                phoneNumber: normalizedPhone,
                campusId,
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Could not create user' });
    }
});
// Delete account (requires auth)
router.delete('/me', auth_1.protect, async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.user.id } });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Could not delete account' });
    }
});
// Complete onboarding: update or create by phone number
router.post('/complete', async (req, res) => {
    const { name, username, phoneNumber, campusId } = req.body;
    if (!phoneNumber || !name || !username || !campusId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const normalizedPhone = normalizePhoneToE164(phoneNumber);
        const existing = await prisma.user.findFirst({ where: { phoneNumber: normalizedPhone } });
        let user;
        if (existing) {
            user = await prisma.user.update({
                where: { id: existing.id },
                data: { name, username, campusId },
            });
        }
        else {
            user = await prisma.user.create({
                data: { name, username, phoneNumber: normalizedPhone, campusId },
            });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error completing user:', error);
        res.status(500).json({ error: 'Could not complete user' });
    }
});
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                submissions: true,
                campus: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        res.status(500).json({ error: 'Could not fetch user' });
    }
});
exports.default = router;
// Update profile image for current user
router.put('/me/profile-image', auth_1.protect, async (req, res) => {
    const { profileImage } = req.body;
    if (!profileImage)
        return res.status(400).json({ error: 'profileImage required' });
    try {
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { profileImage },
            select: { id: true, profileImage: true },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ error: 'Could not update profile image' });
    }
});
