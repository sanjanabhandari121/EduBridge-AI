import { Router } from "express";
import * as knowledgeController from "../controllers/knowledgeController";
import { requireAuth } from "../middleware/auth";
const router = Router();
router.get("/search", requireAuth, knowledgeController.search);
router.post("/ingest", requireAuth, knowledgeController.ingest);
export default router;
