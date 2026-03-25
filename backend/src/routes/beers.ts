import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /beers — List all beers (for quick pick)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.q as string | undefined;
    const beers = await prisma.beer.findMany({
      where: search
        ? { OR: [{ name: { contains: search } }, { brand: { contains: search } }, { type: { contains: search } }] }
        : undefined,
      orderBy: { name: "asc" },
    });
    res.json(beers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /beers/recent — My recently logged beers (for < 3s logging)
router.get("/recent", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recentCheckIns = await prisma.checkIn.findMany({
      where: { userId: req.userId },
      select: { beer: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Deduplicate
    const seen = new Set<string>();
    const recentBeers = recentCheckIns
      .filter((c) => {
        if (seen.has(c.beer.id)) return false;
        seen.add(c.beer.id);
        return true;
      })
      .map((c) => c.beer)
      .slice(0, 5);

    res.json(recentBeers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
