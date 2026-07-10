import { Response } from "express";
import crypto from "crypto";
import { Ticket } from "../models/Ticket";
import { Employee } from "../models/Employee";
import { TrailLog } from "../models/TrailLog";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { sendSocketNotification, getIO } from "../config/socket";
import { buildTicketMongoQuery } from "./ticketController";

export async function markPriority(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body;
    const performerEmpId = req.user?.empId;

    if (!performerEmpId) return res.status(401).json({ message: "Unauthorized" });

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    if (performer.role !== "ADMIN" && performer.role !== "L3") {
      return res.status(403).json({ error: "Priority actions are restricted to Admin and L3." });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.currentStatus === "Closed") {
      return res.status(400).json({ message: "Cannot mark a closed ticket as priority." });
    }

    // Check if already marked by this user
    if (!ticket.priorityMarkedBy) ticket.priorityMarkedBy = [];
    const alreadyMarked = ticket.priorityMarkedBy.some((p) => p.userId === performerEmpId);
    if (alreadyMarked) {
      return res.json(ticket);
    }

    ticket.priorityMarkedBy.push({
      userId: performer.empId,
      name: performer.name,
      role: performer.role,
      subrole: performer.subRole || undefined,
      reason: reason || "",
      markedAt: new Date()
    });
    ticket.isPriority = true;

    await ticket.save();

    const now = new Date();
    const actionText = "Ticket Marked as Priority";
    const roleString = performer.subRole ? `${performer.role} - ${performer.subRole}` : performer.role;

    const newTrailLog = await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: actionText,
      comment: reason ? reason.trim() : "Marked for urgent resolution",
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      currentStatus: ticket.currentStatus,
      actorUserId: performer.empId,
      actorName: performer.name,
      actorRole: performer.role,
      actorDesignation: performer.designation || undefined,
      createdAt: now
    });

    const io = getIO();
    if (io) {
      io.emit("ticket:trail-updated", {
        ticketId,
        trailEntry: newTrailLog
      });
    }

    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action: "Mark Priority",
      context: ticketId,
      createdAt: now
    });

    if (io) {
      io.emit("ticket:priority-updated", {
        ticketId: ticket.ticketId,
        ticketMongoId: ticket._id,
        action: "priority-marked",
        markedByUserId: performer.empId,
        remainingPriorityCount: ticket.priorityMarkedBy?.length || 0,
        isPriority: ticket.isPriority || false
      });
    }

    return res.json(ticket);
  } catch (error: any) {
    console.error("Mark priority error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function removePriority(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const performerEmpId = req.user?.empId;

    if (!performerEmpId) return res.status(401).json({ message: "Unauthorized" });

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    if (performer.role !== "ADMIN" && performer.role !== "L3") {
      return res.status(403).json({ error: "Priority actions are restricted to Admin and L3." });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!ticket.priorityMarkedBy) ticket.priorityMarkedBy = [];
    const initialLength = ticket.priorityMarkedBy.length;
    ticket.priorityMarkedBy = ticket.priorityMarkedBy.filter((p) => p.userId !== performerEmpId);

    if (initialLength === ticket.priorityMarkedBy.length) {
      // Was not marked by this user, nothing to do
      return res.json(ticket);
    }

    ticket.isPriority = ticket.priorityMarkedBy.length > 0;
    await ticket.save();

    const now = new Date();
    const actionText = "Priority Removed";
    const roleString = performer.subRole ? `${performer.role} - ${performer.subRole}` : performer.role;

    const newTrailLog = await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: actionText,
      comment: "No longer requires priority handling",
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      currentStatus: ticket.currentStatus,
      actorUserId: performer.empId,
      actorName: performer.name,
      actorRole: performer.role,
      actorDesignation: performer.designation || undefined,
      createdAt: now
    });

    const io = getIO();
    if (io) {
      io.emit("ticket:trail-updated", {
        ticketId,
        trailEntry: newTrailLog
      });
    }

    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action: "Remove Priority",
      context: ticketId,
      createdAt: now
    });

    if (io) {
      io.emit("ticket:priority-updated", {
        ticketId: ticket.ticketId,
        ticketMongoId: ticket._id,
        action: "priority-removed",
        markedByUserId: performer.empId,
        remainingPriorityCount: ticket.priorityMarkedBy?.length || 0,
        isPriority: ticket.isPriority || false
      });
    }

    return res.json(ticket);
  } catch (error: any) {
    console.error("Remove priority error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function getMyPriorityTickets(req: AuthenticatedRequest, res: Response) {
  try {
    const performerEmpId = req.user?.empId;
    if (!performerEmpId) return res.status(401).json({ message: "Unauthorized" });
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = buildTicketMongoQuery(req.query, req.user);
    
    // Filter to tickets marked by this user
    query["priorityMarkedBy.userId"] = performerEmpId;
    // Ensure not closed
    if (query.currentStatus && query.currentStatus === "Closed") {
       // Do nothing or return empty? Let's just override to only open/resolved 
       // if user requested closed priority, they shouldn't exist because closure clears it.
    } else if (!query.currentStatus) {
      query.currentStatus = { $in: ["Open", "Resolved"] };
    }

    // Default sorting logic for Priority lists: newest markedAt first (approximate using updatedAt or createdAt)
    const sortParams: any = { updatedAt: -1 };

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort(sortParams)
      .skip(skip)
      .limit(limit);

    return res.json({
      rows: tickets,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("Get my priority tickets error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function getAdminPriorityTickets(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== "ADMIN" && req.user?.role !== "L3") {
      return res.status(403).json({ message: "Access forbidden: Insufficient permissions" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = buildTicketMongoQuery(req.query, req.user);
    
    query["priorityMarkedBy.0"] = { $exists: true };
    if (!query.currentStatus) {
      query.currentStatus = { $in: ["Open", "Resolved"] };
    }
    
    if (req.query.markedBy) {
       query["priorityMarkedBy.userId"] = req.query.markedBy;
    }

    const sortParams: any = { updatedAt: -1 };

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort(sortParams)
      .skip(skip)
      .limit(limit);

    return res.json({
      rows: tickets,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("Get admin priority tickets error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function getPersonalPriorityCount(req: AuthenticatedRequest, res: Response) {
  try {
    const performerEmpId = req.user?.empId;
    if (!performerEmpId) return res.status(401).json({ message: "Unauthorized" });

    const count = await Ticket.countDocuments({
      currentStatus: { $in: ["Open", "Resolved"] },
      "priorityMarkedBy.userId": performerEmpId
    });
    return res.json({ count });
  } catch (error: any) {
    console.error("Get personal priority count error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getGlobalPriorityCount(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== "ADMIN" && req.user?.role !== "L3") {
      return res.status(403).json({ message: "Access forbidden" });
    }

    const count = await Ticket.countDocuments({
      currentStatus: { $in: ["Open", "Resolved"] },
      "priorityMarkedBy.0": { $exists: true }
    });
    return res.json({ count });
  } catch (error: any) {
    console.error("Get global priority count error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
