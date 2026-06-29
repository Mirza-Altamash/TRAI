import { Router } from "express";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../controllers/notificationController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, listNotifications);
router.post("/read-all", authenticateToken, markAllNotificationsRead);
router.post("/:id/read", authenticateToken, markNotificationRead);

export default router;
