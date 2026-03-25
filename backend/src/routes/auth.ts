import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthRequest, authMiddleware, generateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /auth/register
router.post("/register", async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) {
      res.status(409).json({ error: "Email ou username deja pris" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashed },
    });

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, level: user.level, xp: user.xp },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /auth/login
router.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, level: user.level, xp: user.xp, avatar: user.avatar },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, email: true, avatar: true, level: true, xp: true, ghostMode: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "Utilisateur non trouve" });
    return;
  }
  res.json(user);
});

export default router;
