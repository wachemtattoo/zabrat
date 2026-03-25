import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /badges — All badges with unlock status
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const allBadges = await prisma.badge.findMany({ orderBy: { category: "asc" } });
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.userId },
      select: { badgeId: true, unlockedAt: true },
    });
    const unlockedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.unlockedAt]));

    const badges = allBadges.map((b) => ({
      ...b,
      unlocked: unlockedMap.has(b.id),
      unlockedAt: unlockedMap.get(b.id) || null,
    }));

    res.json(badges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
