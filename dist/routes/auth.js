"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const twilio_1 = __importDefault(require("twilio"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Build a Twilio client using either Account SID/Auth Token or API Key/Secret
const getTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    if (apiKey && apiSecret && accountSid) {
        return (0, twilio_1.default)(apiKey, apiSecret, { accountSid });
    }
    if (accountSid && authToken) {
        return (0, twilio_1.default)(accountSid, authToken);
    }
    throw new Error('Missing Twilio credentials. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN or TWILIO_API_KEY, TWILIO_API_SECRET, and TWILIO_ACCOUNT_SID');
};
// Normalize phone numbers to E.164. Default to US if 10 digits without country code
const normalizePhoneToE164 = (raw) => {
    if (!raw)
        return raw;
    const trimmed = String(raw).trim();
    if (trimmed.startsWith('+'))
        return trimmed.replace(/\s+/g, '');
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10)
        return `+1${digits}`; // US default
    if (digits.length === 11 && digits.startsWith('1'))
        return `+${digits}`;
    return `+${digits}`;
};
const loginSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string(),
});
router.post('/login', async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid login data', details: result.error.errors });
    }
    const { username, password } = result.data;
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                campusId: user.campusId,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Could not log in' });
    }
});
// OTP via Twilio Verify
const otpStartSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string(),
});
router.post('/otp/start', async (req, res) => {
    const result = otpStartSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid data', details: result.error.errors });
    }
    try {
        const verifySid = process.env.TWILIO_VERIFY_SID;
        if (!verifySid) {
            return res.status(500).json({ error: 'Missing TWILIO_VERIFY_SID' });
        }
        const client = getTwilioClient();
        const to = normalizePhoneToE164(result.data.phoneNumber);
        const verification = await client.verify.v2
            .services(verifySid)
            .verifications.create({ to, channel: 'sms' });
        res.json({ sid: verification.sid, status: verification.status, to });
    }
    catch (error) {
        const code = error?.code;
        if (code === 20003) {
            return res.status(401).json({ error: 'Twilio authentication failed. Check credentials.' });
        }
        console.error('OTP start error:', error);
        res.status(500).json({ error: 'Could not start verification' });
    }
});
const otpVerifySchema = zod_1.z.object({
    phoneNumber: zod_1.z.string(),
    code: zod_1.z.string(),
});
router.post('/otp/verify', async (req, res) => {
    const result = otpVerifySchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid data', details: result.error.errors });
    }
    try {
        const verifySid = process.env.TWILIO_VERIFY_SID;
        if (!verifySid) {
            return res.status(500).json({ error: 'Missing TWILIO_VERIFY_SID' });
        }
        const client = getTwilioClient();
        const to = normalizePhoneToE164(result.data.phoneNumber);
        const check = await client.verify.v2
            .services(verifySid)
            .verificationChecks.create({ to, code: result.data.code });
        if (check.status !== 'approved') {
            return res.status(401).json({ error: 'Invalid code' });
        }
        // Find or create user by phone (no password)
        let user = await prisma.user.findFirst({ where: { phoneNumber: to } });
        if (!user) {
            let campus = await prisma.campus.findFirst();
            if (!campus) {
                campus = await prisma.campus.create({ data: { name: 'Default Campus' } });
            }
            user = await prisma.user.create({
                data: {
                    name: 'New User',
                    username: `user_${Date.now()}`,
                    phoneNumber: to,
                    campusId: campus.id,
                },
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: { id: user.id, name: user.name, username: user.username, campusId: user.campusId },
        });
    }
    catch (error) {
        const code = error?.code;
        if (code === 20003) {
            return res.status(401).json({ error: 'Twilio authentication failed. Check credentials.' });
        }
        console.error('OTP verify error:', error);
        res.status(500).json({ error: 'Could not verify code' });
    }
});
exports.default = router;
