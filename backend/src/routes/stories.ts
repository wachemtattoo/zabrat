import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /stories — Active stories from friends (last 24h)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
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
    friendIds.push(req.userId!);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.checkIn.findMany({
      where: {
        userId: { in: friendIds },
        isStory: true,
        createdAt: { gte: twentyFourHoursAgo },
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        beer: true,
        bar: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by user
    const grouped = new Map<string, typeof stories>();
    for (const story of stories) {
      const userId = story.user.id;
      if (!grouped.has(userId)) grouped.set(userId, []);
      grouped.get(userId)!.push(story);
    }

    const result = Array.from(grouped.entries()).map(([userId, items]) => ({
      user: items[0].user,
      stories: items,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
