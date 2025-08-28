import { Router } from 'express';
import { prisma } from '../app';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const startOfUtcDay = (d: Date) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return x;
};

// POST /api/v1/buyins
// body: { campusId?: string, date?: string(YYYY-MM-DD), amount?: number }
// If date omitted, defaults to tomorrow (UTC) start of day
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { campusId: bodyCampusId, date: dateStr, amount } = req.body as { campusId?: string; date?: string; amount?: number };

    // Determine campus
    const campusId = bodyCampusId || req.user?.campusId;
    if (!campusId) return res.status(400).json({ error: 'campusId required' });

    let date: Date;
    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map((v: string) => parseInt(v, 10));
      if (!y || !m || !d) return res.status(400).json({ error: 'Invalid date format' });
      date = new Date(Date.UTC(y, m - 1, d));
    } else {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      date = startOfUtcDay(tomorrow);
    }

    const created = await (prisma as any).buyIn.upsert({
      where: { userId_campusId_date: { userId, campusId, date } },
      update: { amount: amount ?? 1 },
      create: { userId, campusId, date, amount: amount ?? 1 },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error('Buy-in create error', e);
    res.status(500).json({ error: 'Failed to create buy-in' });
  }
});

// GET /api/v1/buyins/status?date=YYYY-MM-DD&campusId=...
// If date omitted, defaults to today (UTC)
router.get('/status', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const campusId = (req.query.campusId as string) || req.user?.campusId;
    if (!campusId) return res.status(400).json({ error: 'campusId required' });

    const dateStr = req.query.date as string | undefined;
    let date: Date;
    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map((v: string) => parseInt(v, 10));
      if (!y || !m || !d) return res.status(400).json({ error: 'Invalid date format' });
      date = new Date(Date.UTC(y, m - 1, d));
    } else {
      date = startOfUtcDay(new Date());
    }

    const found = await (prisma as any).buyIn.findUnique({ where: { userId_campusId_date: { userId, campusId, date } } });
    res.json({ hasBuyIn: !!found, buyIn: found || null });
  } catch (e) {
    console.error('Buy-in status error', e);
    res.status(500).json({ error: 'Failed to check buy-in status' });
  }
});

export default router;


