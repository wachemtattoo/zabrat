import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /rankings — Weekly ranking among friends
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get friend IDs
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

    // Week start (Monday)
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    // Count check-ins per friend this week
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: { in: friendIds },
        createdAt: { gte: weekStart },
      },
      select: { userId: true },
    });

    const counts: Record<string, number> = {};
    checkIns.forEach((c) => {
      counts[c.userId] = (counts[c.userId] || 0) + 1;
    });

    // Get user info
    const users = await prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, username: true, avatar: true, level: true },
    });

    const ranking = users
      .map((u) => ({ ...u, weeklyCount: counts[u.id] || 0 }))
      .sort((a, b) => b.weeklyCount - a.weeklyCount);

    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
