import { Router } from "express";
import * as tutorController from "../controllers/tutorController";
import { requireAuth, requireRole } from "../middleware/auth";
const router = Router();
router.use(requireAuth, requireRole("STUDENT"));
router.post("/ask", tutorController.ask);
router.get("/history", tutorController.history);
export default router;
