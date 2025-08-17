import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest, protect } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

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

    const user = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        phoneNumber,
        campusId,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Could not create user' });
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
