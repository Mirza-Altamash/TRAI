import { Router } from "express";
import {
  createTicket,
  listTickets,
  getTicket,
  addComment,
  reassignTicket,
  updateStatus,
  listAssigneeTicketsSplit,
  deleteTicket,
  reopenTicket
} from "../controllers/ticketController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { upload, trailUpload } from "../middleware/uploadMiddleware";
import {
  markPriority,
  removePriority,
  getMyPriorityTickets,
  getGlobalPriorityCount,
  getPersonalPriorityCount
} from "../controllers/priorityController";

const router = Router();

// Routes for ticket management
router.get("/split/assignee", authenticateToken, listAssigneeTicketsSplit);
router.get("/priority/my", authenticateToken, getMyPriorityTickets);
router.get("/priority/my-count", authenticateToken, getPersonalPriorityCount);
router.get("/priority/global-count", authenticateToken, getGlobalPriorityCount);
router.get("/", authenticateToken, listTickets);
router.get("/:ticketId", authenticateToken, getTicket);
router.post("/", authenticateToken, upload.array("attachments"), createTicket);
router.post("/:ticketId/comments", authenticateToken, trailUpload.array("attachments"), addComment);
router.post("/:ticketId/reassign", authenticateToken, trailUpload.array("attachments"), reassignTicket);
router.put("/:ticketId/status", authenticateToken, trailUpload.array("attachments"), updateStatus);
router.post("/:ticketId/reopen", authenticateToken, trailUpload.array("attachments"), reopenTicket);
router.post("/:ticketId/priority", authenticateToken, markPriority);
router.delete("/:ticketId/priority", authenticateToken, removePriority);
router.delete("/:ticketId", authenticateToken, requireRole(["ADMIN", "L3"]), deleteTicket);

export default router;
