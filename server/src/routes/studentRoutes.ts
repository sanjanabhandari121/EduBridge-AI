import { Router } from "express";
import * as studentController from "../controllers/studentController";
import { requireAuth, requireRole } from "../middleware/auth";
const router = Router();
router.use(requireAuth, requireRole("STUDENT"));
router.get("/dashboard", studentController.dashboard);
router.get("/progress", studentController.progress);
router.get("/weak-topics", studentController.weakTopics);
export default router;
