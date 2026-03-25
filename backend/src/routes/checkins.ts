import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { checkBadges } from "../services/badgeEngine";

const router = Router();
const prisma = new PrismaClient();

const checkInSchema = z.object({
  beerId: z.string(),
  barId: z.string().optional(),
  photoUrl: z.string().optional(),
  isStory: z.boolean().optional(),
  note: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// POST /checkins — Log a beer (< 3 seconds goal)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = checkInSchema.parse(req.body);

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: req.userId!,
        beerId: data.beerId,
        barId: data.barId,
        photoUrl: data.photoUrl,
        isStory: data.isStory ?? false,
        note: data.note,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: {
        beer: true,
        bar: true,
      },
    });

    // Add XP
    await prisma.user.update({
      where: { id: req.userId },
      data: { xp: { increment: 10 } },
    });

    // Check badges in background (don't block response)
    checkBadges(req.userId!).catch(console.error);

    res.status(201).json(checkIn);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /checkins/feed — Friends' recent check-ins
router.get("/feed", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.userId === req.userId ? f.friendId : f.userId
    );
    friendIds.push(req.userId!); // include self

    const feed = await prisma.checkIn.findMany({
      where: { userId: { in: friendIds } },
      include: {
        user: { select: { id: true, username: true, avatar: true, level: true } },
        beer: true,
        bar: { select: { id: true, name: true } },
        _count: { select: { cheers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /checkins/my — My check-ins history
router.get("/my", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: { userId: req.userId },
      include: { beer: true, bar: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(checkIns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /checkins/stats — Personal stats
router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const totalCheckins = await prisma.checkIn.count({ where: { userId: req.userId } });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = await prisma.checkIn.count({
      where: { userId: req.userId, createdAt: { gte: weekStart } },
    });

    const uniqueBars = await prisma.checkIn.findMany({
      where: { userId: req.userId, barId: { not: null } },
      select: { barId: true },
      distinct: ["barId"],
    });

    const uniqueTypes = await prisma.checkIn.findMany({
      where: { userId: req.userId },
      select: { beer: { select: { type: true } } },
      distinct: ["beerId"],
    });
    const types = [...new Set(uniqueTypes.map((c) => c.beer.type))];

    // Favorite beer type
    const allCheckIns = await prisma.checkIn.findMany({
      where: { userId: req.userId },
      include: { beer: { select: { type: true } } },
    });
    const typeCounts: Record<string, number> = {};
    allCheckIns.forEach((c) => {
      typeCounts[c.beer.type] = (typeCounts[c.beer.type] || 0) + 1;
    });
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      totalCheckins,
      thisWeek,
      uniqueBars: uniqueBars.length,
      uniqueTypes: types.length,
      favoriteType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
