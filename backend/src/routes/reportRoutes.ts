import { Router } from "express";
import {
  getAdminMetrics,
  getUserMetrics,
  getAssigneeMetrics,
  getChartsAnalytics,
  getSlaMetrics,
  getMisReport,
  listAuditLogs,
  getAssigneeAssignmentsReport
} from "../controllers/reportController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Analytics endpoints
router.get("/analytics/admin", authenticateToken, requireRole(["ADMIN", "L3"]), getAdminMetrics);
router.get("/analytics/user", authenticateToken, getUserMetrics);
router.get("/analytics/assignee", authenticateToken, getAssigneeMetrics);
router.get("/analytics/charts", authenticateToken, requireRole(["ADMIN", "L3"]), getChartsAnalytics);

// SLA and MIS endpoints
router.get("/sla/metrics", authenticateToken, requireRole(["ADMIN", "L3"]), getSlaMetrics);
router.get("/mis/report", authenticateToken, requireRole(["ADMIN", "L3"]), getMisReport);
router.get("/assignee-assignments", authenticateToken, requireRole(["ADMIN", "L3"]), getAssigneeAssignmentsReport);

// Audit logs (Admin/L3)
router.get("/audit", authenticateToken, requireRole(["ADMIN", "L3"]), listAuditLogs);

export default router;
