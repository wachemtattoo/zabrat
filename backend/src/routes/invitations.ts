import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// POST /invitations — Create "who's joining?"
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { barId, message } = req.body;
    if (!barId) {
      res.status(400).json({ error: "barId requis" });
      return;
    }

    const bar = await prisma.bar.findUnique({ where: { id: barId } });
    if (!bar) {
      res.status(404).json({ error: "Bar non trouve" });
      return;
    }

    // Expires in 4 hours
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        userId: req.userId!,
        barId,
        message: message || null,
        expiresAt,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        bar: { select: { id: true, name: true, address: true } },
      },
    });

    res.status(201).json(invitation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /invitations — Active invitations from friends
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
    friendIds.push(req.userId!); // include own invitations

    const invitations = await prisma.invitation.findMany({
      where: {
        userId: { in: friendIds },
        expiresAt: { gte: new Date() },
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        bar: { select: { id: true, name: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invitations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
