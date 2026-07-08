import { Router } from "express";
import { getTrailLogs } from "../controllers/trailController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/:ticketId", authenticateToken, getTrailLogs);

export default router;
