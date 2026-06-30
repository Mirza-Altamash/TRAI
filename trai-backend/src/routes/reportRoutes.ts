import { Router } from "express";
import {
  getAdminMetrics,
  getUserMetrics,
  getAssigneeMetrics,
  getChartsAnalytics,
  getSlaMetrics,
  getMisReport,
  listAuditLogs
} from "../controllers/reportController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Analytics endpoints
router.get("/analytics/admin", authenticateToken, getAdminMetrics);
router.get("/analytics/user", authenticateToken, getUserMetrics);
router.get("/analytics/assignee", authenticateToken, getAssigneeMetrics);
router.get("/analytics/charts", authenticateToken, getChartsAnalytics);

// SLA and MIS endpoints
router.get("/sla/metrics", authenticateToken, getSlaMetrics);
router.get("/mis/report", authenticateToken, getMisReport);

// Audit logs (Admin/L3)
router.get("/audit", authenticateToken, requireRole(["ADMIN", "L3"]), listAuditLogs);

export default router;
