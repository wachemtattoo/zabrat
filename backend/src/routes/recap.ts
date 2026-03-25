import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /recap/weekly — Weekly recap (Spotify Wrapped style)
router.get("/weekly", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const checkIns = await prisma.checkIn.findMany({
      where: { userId: req.userId, createdAt: { gte: weekStart } },
      include: {
        beer: true,
        bar: { select: { id: true, name: true } },
      },
    });

    const totalBeers = checkIns.length;

    // Unique bars
    const bars = [...new Set(checkIns.filter((c) => c.barId).map((c) => c.bar!.name))];

    // Favorite beer this week
    const beerCounts: Record<string, number> = {};
    checkIns.forEach((c) => {
      beerCounts[c.beer.name] = (beerCounts[c.beer.name] || 0) + 1;
    });
    const favoriteBeer = Object.entries(beerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Favorite type
    const typeCounts: Record<string, number> = {};
    checkIns.forEach((c) => {
      typeCounts[c.beer.type] = (typeCounts[c.beer.type] || 0) + 1;
    });
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Badges unlocked this week
    const newBadges = await prisma.userBadge.findMany({
      where: { userId: req.userId, unlockedAt: { gte: weekStart } },
      include: { badge: true },
    });

    // Ranking position
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
    });
    const friendIds = friendships.map((f) =>
      f.userId === req.userId ? f.friendId : f.userId
    );
    friendIds.push(req.userId!);

    const allCheckIns = await prisma.checkIn.findMany({
      where: { userId: { in: friendIds }, createdAt: { gte: weekStart } },
      select: { userId: true },
    });
    const counts: Record<string, number> = {};
    allCheckIns.forEach((c) => {
      counts[c.userId] = (counts[c.userId] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const rankPosition = sorted.findIndex(([id]) => id === req.userId) + 1;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { username: true, level: true, xp: true },
    });

    res.json({
      username: user?.username,
      totalBeers,
      bars,
      favoriteBeer,
      favoriteType,
      newBadges: newBadges.map((b) => ({ name: b.badge.name, icon: b.badge.icon })),
      rankPosition,
      totalFriends: friendIds.length - 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
