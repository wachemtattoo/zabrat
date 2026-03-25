import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(150).optional().nullable(),
  city: z.string().max(50).optional().nullable(),
  avatar: z.string().optional().nullable(),
  ghostMode: z.boolean().optional(),
});

// PUT /profile — Update profile
router.put("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    // Check username uniqueness if changing
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id: req.userId } },
      });
      if (existing) {
        res.status(409).json({ error: "Ce username est deja pris" });
        return;
      }
    }

    // Check email uniqueness if changing
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: req.userId } },
      });
      if (existing) {
        res.status(409).json({ error: "Cet email est deja pris" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true, username: true, email: true, avatar: true,
        bio: true, city: true, level: true, xp: true, ghostMode: true,
      },
    });

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /profile/password — Change password
router.put("/password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Mot de passe doit faire au moins 6 caracteres" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: "Utilisateur non trouve" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: "Mot de passe actuel incorrect" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /profile — Delete account
router.delete("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Delete all user data in order
    await prisma.cheers.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });
    await prisma.userBadge.deleteMany({ where: { userId } });
    await prisma.invitation.deleteMany({ where: { userId } });
    await prisma.barReview.deleteMany({ where: { userId } });
    await prisma.checkIn.deleteMany({ where: { userId } });
    await prisma.friendship.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } });
    await prisma.bar.deleteMany({ where: { createdById: userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ ok: true, message: "Compte supprime" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
