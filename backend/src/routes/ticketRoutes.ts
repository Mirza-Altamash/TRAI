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

const router = Router();

// Routes for ticket management
router.get("/split/assignee", authenticateToken, listAssigneeTicketsSplit);
router.get("/", authenticateToken, listTickets);
router.get("/:ticketId", authenticateToken, getTicket);
router.post("/", authenticateToken, upload.array("attachments"), createTicket);
router.post("/:ticketId/comments", authenticateToken, trailUpload.array("attachments"), addComment);
router.post("/:ticketId/reassign", authenticateToken, trailUpload.array("attachments"), reassignTicket);
router.put("/:ticketId/status", authenticateToken, trailUpload.array("attachments"), updateStatus);
router.post("/:ticketId/reopen", authenticateToken, trailUpload.array("attachments"), reopenTicket);
router.delete("/:ticketId", authenticateToken, requireRole(["ADMIN", "L3"]), deleteTicket);

export default router;
