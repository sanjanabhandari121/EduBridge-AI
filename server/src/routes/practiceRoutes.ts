import { Router } from "express";
import * as practiceController from "../controllers/practiceController";
import { requireAuth, requireRole } from "../middleware/auth";
const router = Router();
router.use(requireAuth, requireRole("STUDENT"));
router.post("/generate", practiceController.generate);
router.post("/submit", practiceController.submit);
export default router;
