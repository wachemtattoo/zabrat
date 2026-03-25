import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const createBarSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// GET /bars — Search bars
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.q as string | undefined;
    const bars = await prisma.bar.findMany({
      where: search
        ? { name: { contains: search } }
        : undefined,
      orderBy: { name: "asc" },
      take: 50,
    });
    res.json(bars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /bars — Create a bar
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createBarSchema.parse(req.body);
    const bar = await prisma.bar.create({
      data: {
        ...data,
        createdById: req.userId!,
      },
    });
    res.status(201).json(bar);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /bars/:id — Bar detail with stats
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bar = await prisma.bar.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { checkIns: true, reviews: true } },
      },
    });
    if (!bar) {
      res.status(404).json({ error: "Bar non trouve" });
      return;
    }

    // Aggregate ratings
    const avgRating = bar.reviews.length > 0
      ? bar.reviews.reduce((sum, r) => sum + r.rating, 0) / bar.reviews.length
      : null;

    // Friends currently at this bar (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
    });
    const friendIds = friendships.map((f) =>
      f.userId === req.userId ? f.friendId : f.userId
    );

    const friendsHere = await prisma.checkIn.findMany({
      where: {
        barId: bar.id,
        userId: { in: friendIds },
        createdAt: { gte: twoHoursAgo },
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      distinct: ["userId"],
    });

    res.json({
      ...bar,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      friendsHere: friendsHere.map((c) => c.user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /bars/:id/review — Review a bar
router.post("/:id/review", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, priceRating, ambianceRating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating entre 1 et 5" });
      return;
    }

    const existing = await prisma.barReview.findUnique({
      where: { userId_barId: { userId: req.userId!, barId: req.params.id } },
    });
    if (existing) {
      res.status(409).json({ error: "Tu as deja note ce bar" });
      return;
    }

    const review = await prisma.barReview.create({
      data: {
        userId: req.userId!,
        barId: req.params.id,
        rating,
        priceRating,
        ambianceRating,
        comment,
      },
    });
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
