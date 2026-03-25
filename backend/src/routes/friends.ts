import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// POST /friends/request — Send friend request
router.post("/request", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    const friend = await prisma.user.findUnique({ where: { username } });
    if (!friend) {
      res.status(404).json({ error: "Utilisateur non trouve" });
      return;
    }
    if (friend.id === req.userId) {
      res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-meme" });
      return;
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: req.userId, friendId: friend.id },
          { userId: friend.id, friendId: req.userId },
        ],
      },
    });
    if (existing) {
      res.status(409).json({ error: "Demande deja envoyee ou deja amis" });
      return;
    }

    const friendship = await prisma.friendship.create({
      data: { userId: req.userId!, friendId: friend.id },
    });
    res.status(201).json(friendship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /friends/accept/:id — Accept friend request
router.post("/accept/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!friendship || friendship.friendId !== req.userId) {
      res.status(404).json({ error: "Demande non trouvee" });
      return;
    }
    const updated = await prisma.friendship.update({
      where: { id: req.params.id },
      data: { status: "accepted" },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /friends/:id — Remove friend
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.friendship.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /friends — List my friends
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
      include: {
        user: { select: { id: true, username: true, avatar: true, level: true } },
        friend: { select: { id: true, username: true, avatar: true, level: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.userId === req.userId ? f.friend : f.user
    );
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /friends/pending — Pending requests received
router.get("/pending", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pending = await prisma.friendship.findMany({
      where: { friendId: req.userId, status: "pending" },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
