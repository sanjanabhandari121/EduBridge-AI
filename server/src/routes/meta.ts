import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { Response } from "express";

const router = Router();

// Topics list is used across the frontend for dropdowns (subject/topic pickers).
router.get("/subjects", requireAuth, async (_req, res) => {
  const subjects = await prisma.subject.findMany({ include: { topics: true } });
  res.json({ subjects });
});

router.get("/me/preference", requireAuth, async (req: AuthedRequest, res: Response) => {
  const pref = await prisma.userPreference.findUnique({ where: { userId: req.user!.userId } });
  res.json({ preference: pref });
});

router.put("/me/preference", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { language, level } = req.body;
  const pref = await prisma.userPreference.upsert({
    where: { userId: req.user!.userId },
    update: { ...(language ? { language } : {}), ...(level ? { level } : {}) },
    create: { userId: req.user!.userId, language: language || "ENGLISH", level: level || "BEGINNER" },
  });
  res.json({ preference: pref });
});

export default router;
