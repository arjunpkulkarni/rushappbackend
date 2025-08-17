import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest, protect } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Normalize phone numbers to E.164 with US default
const normalizePhoneToE164 = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('+')) return trimmed.replace(/\s+/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return undefined;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
};

router.get('/me', protect, async (req: AuthRequest, res) => {
  res.json(req.user);
});

router.post('/', async (req, res) => {
  const { name, username, password, phoneNumber, campusId } = req.body;

  if (!name || !username || !campusId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let passwordHash: string | undefined = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
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
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Could not create user' });
  }
});

// Delete account (requires auth)
router.delete('/me', protect, async (req: AuthRequest, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ success: true });
  } catch (error) {
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
    const normalizedPhone = normalizePhoneToE164(phoneNumber)!;
    const existing = await prisma.user.findFirst({ where: { phoneNumber: normalizedPhone } });
    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { name, username, campusId },
      });
    } else {
      user = await prisma.user.create({
        data: { name, username, phoneNumber: normalizedPhone, campusId },
      });
    }
    res.json(user);
  } catch (error) {
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
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      res.status(500).json({ error: 'Could not fetch user' });
    }
  });

export default router;

// Update profile image for current user
router.put('/me/profile-image', protect, async (req: AuthRequest, res) => {
  const { profileImage } = req.body as { profileImage?: string };
  if (!profileImage) return res.status(400).json({ error: 'profileImage required' });
  try {
    const updated = await prisma.user.update({
      where: { id: (req as any).user.id },
      data: { profileImage },
      select: { id: true, profileImage: true },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ error: 'Could not update profile image' });
  }
});
