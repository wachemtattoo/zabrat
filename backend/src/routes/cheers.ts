import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { checkBadges } from "../services/badgeEngine";

const router = Router();
const prisma = new PrismaClient();

// POST /cheers — Send cheers on a check-in
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { checkInId } = req.body;
    if (!checkInId) {
      res.status(400).json({ error: "checkInId requis" });
      return;
    }

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      select: { userId: true },
    });
    if (!checkIn) {
      res.status(404).json({ error: "Check-in non trouve" });
      return;
    }

    // Can't cheers your own check-in
    if (checkIn.userId === req.userId) {
      res.status(400).json({ error: "Tu ne peux pas te cheers toi-meme" });
      return;
    }

    // Check if already cheered
    const existing = await prisma.cheers.findFirst({
      where: { fromUserId: req.userId, checkInId },
    });
    if (existing) {
      res.status(409).json({ error: "Deja cheers" });
      return;
    }

    const cheers = await prisma.cheers.create({
      data: {
        fromUserId: req.userId!,
        toUserId: checkIn.userId,
        checkInId,
      },
    });

    // Check badges for sender (social badges)
    checkBadges(req.userId!).catch(console.error);

    res.status(201).json(cheers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /cheers/count/:checkInId — Get cheers count + if current user cheered
router.get("/count/:checkInId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.cheers.count({
      where: { checkInId: req.params.checkInId },
    });
    const myCheers = await prisma.cheers.findFirst({
      where: { fromUserId: req.userId, checkInId: req.params.checkInId },
    });
    res.json({ count, cheered: !!myCheers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
