import { Router } from "express";
import {
  createTicket,
  listTickets,
  getTicket,
  addComment,
  reassignTicket,
  updateStatus,
  listAssigneeTicketsSplit
} from "../controllers/ticketController";
import { authenticateToken } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

// Routes for ticket management
router.get("/split/assignee", authenticateToken, listAssigneeTicketsSplit);
router.get("/", authenticateToken, listTickets);
router.get("/:ticketId", authenticateToken, getTicket);
router.post("/", authenticateToken, upload.array("attachments"), createTicket);
router.post("/:ticketId/comments", authenticateToken, addComment);
router.post("/:ticketId/reassign", authenticateToken, reassignTicket);
router.put("/:ticketId/status", authenticateToken, updateStatus);

export default router;
