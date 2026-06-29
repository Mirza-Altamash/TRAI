import { Response } from "express";
import crypto from "crypto";
import { Ticket, IAttachment } from "../models/Ticket";
import { Employee } from "../models/Employee";
import { TrailLog } from "../models/TrailLog";
import { Notification } from "../models/Notification";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { sendSocketNotification } from "../config/socket";

export async function createTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { division, priority, type, portalName, portalUrl, reportName, summary, description, assigneeEmpId } = req.body;
    const creatorEmpId = req.user?.empId;

    if (!division || !priority || !type || !summary || !description || !assigneeEmpId || !creatorEmpId) {
      return res.status(400).json({ message: "Missing required fields for ticket creation" });
    }

    // Validate assignee
    const assignee = await Employee.findOne({ empId: assigneeEmpId });
    if (!assignee) {
      return res.status(400).json({ message: "Invalid assignee employee" });
    }

    // Get creator details
    const creator = await Employee.findOne({ empId: creatorEmpId });
    if (!creator) {
      return res.status(400).json({ message: "Creator employee not found" });
    }

    // Generate ticketId sequentially: TRAI-YYYY-NNNN
    const year = new Date().getFullYear();
    const prefix = `TRAI-${year}-`;
    const lastTicket = await Ticket.findOne({ ticketId: new RegExp(`^${prefix}`) })
      .sort({ createdAt: -1 })
      .select("ticketId");

    let sequence = 1;
    if (lastTicket) {
      const parts = lastTicket.ticketId.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    const ticketId = `${prefix}${String(sequence).padStart(4, "0")}`;

    // Process attachments
    const attachments: IAttachment[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          id: file.filename,
          name: file.originalname,
          sizeKb: Math.round(file.size / 1024),
          uploadedAt: new Date()
        });
      }
    }

    const now = new Date();

    // Create the ticket
    const ticket = await Ticket.create({
      ticketId,
      division,
      priority,
      type,
      portalName: type !== "New Development" ? portalName : undefined,
      portalUrl: type !== "New Development" ? portalUrl : undefined,
      reportName: type === "Reports" ? reportName : undefined,
      summary,
      description,
      attachments,
      currentAssignee: assignee.empId,
      currentAssigneeName: assignee.name,
      currentAssigneeRole: assignee.role,
      currentStatus: "Assigned", // Directly assigned on creation
      createdBy: creator.empId,
      createdByName: creator.name,
      assignedAt: now,
      autoCloseEligible: true
    });

    // Create TrailLog for creation
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: "Ticket Created",
      comment: summary,
      performedBy: creator.empId,
      performedByName: creator.name,
      performerRole: creator.role,
      currentStatus: "Open",
      createdAt: now
    });

    // Create TrailLog for assignment
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: "Assignment",
      comment: `Assigned to ${assignee.name}`,
      performedBy: creator.empId,
      performedByName: creator.name,
      performerRole: creator.role,
      toAssignee: assignee.empId,
      currentStatus: "Assigned",
      createdAt: now
    });

    // Create notification for assignee
    const notificationId = crypto.randomUUID();
    const notif = await Notification.create({
      id: notificationId,
      empId: assignee.empId,
      title: "New ticket assigned",
      description: `${ticketId} assigned to you`,
      ticketId,
      read: false,
      createdAt: now
    });

    // Emit Socket.IO notification to assignee
    sendSocketNotification(assignee.empId, notif.toObject());

    // Write AuditLog
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: creator.empId,
      empName: creator.name,
      role: creator.role,
      action: "Ticket Create",
      context: ticketId,
      createdAt: now
    });

    return res.status(201).json(ticket);
  } catch (error: any) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function listTickets(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, division, priority, status, assignee, createdBy, page = 1, pageSize = 10 } = req.query;

    const p = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    const query: any = {};

    // Search matches ticketId or summary
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { ticketId: searchRegex },
        { summary: searchRegex }
      ];
    }

    if (division) query.division = division;
    if (priority) query.priority = priority;
    if (status) query.currentStatus = status;
    if (assignee) query.currentAssignee = assignee;
    if (createdBy) query.createdBy = createdBy;

    // Enforce role permission guards
    if (req.user && req.user.role === "USER") {
      // Regular users can only see tickets they raised
      query.createdBy = req.user.empId;
    }

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip((p - 1) * size)
      .limit(size);

    return res.json({
      rows: tickets,
      total,
      page: p,
      pageSize: size
    });
  } catch (error: any) {
    console.error("List tickets error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function getTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Role verification
    if (req.user && req.user.role === "USER" && ticket.createdBy !== req.user.empId) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(ticket);
  } catch (error: any) {
    console.error("Get ticket error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const { comment } = req.body;
    const performerEmpId = req.user?.empId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    const now = new Date();

    // Create TrailLog
    const log = await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: "Comment",
      comment: comment.trim(),
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      currentStatus: ticket.currentStatus,
      createdAt: now
    });

    // Notify other party (CreatedBy or CurrentAssignee)
    const recipientEmpId = performer.empId === ticket.createdBy ? ticket.currentAssignee : ticket.createdBy;

    const notif = await Notification.create({
      id: crypto.randomUUID(),
      empId: recipientEmpId,
      title: "Comment added",
      description: `${performer.name} commented on ${ticketId}`,
      ticketId,
      read: false,
      createdAt: now
    });

    sendSocketNotification(recipientEmpId, notif.toObject());

    // Write AuditLog
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action: "Comment",
      context: ticketId,
      createdAt: now
    });

    return res.status(201).json(log);
  } catch (error: any) {
    console.error("Add comment error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function reassignTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const { toEmpId } = req.body;
    const performerEmpId = req.user?.empId;

    if (!toEmpId) {
      return res.status(400).json({ message: "Assignee ID is required" });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.currentStatus === "Closed") {
      return res.status(400).json({ message: "Cannot reassign a closed ticket" });
    }

    const assignee = await Employee.findOne({ empId: toEmpId });
    if (!assignee) {
      return res.status(400).json({ message: "Target assignee employee not found" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    const prevName = ticket.currentAssigneeName;
    const prevEmpId = ticket.currentAssignee;
    const now = new Date();

    // Update ticket assignee and ensure status is Assigned
    ticket.currentAssignee = assignee.empId;
    ticket.currentAssigneeName = assignee.name;
    ticket.currentAssigneeRole = assignee.role;
    ticket.currentStatus = "Assigned";
    ticket.assignedAt = now;
    await ticket.save();

    // Create TrailLog for reassignment
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: "Reassignment",
      comment: `Reassigned from ${prevName} to ${assignee.name}`,
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      fromAssignee: prevEmpId,
      toAssignee: assignee.empId,
      currentStatus: "Assigned",
      createdAt: now
    });

    // Notify new assignee
    const notif = await Notification.create({
      id: crypto.randomUUID(),
      empId: assignee.empId,
      title: "Ticket reassigned",
      description: `${ticketId} reassigned to you`,
      ticketId,
      read: false,
      createdAt: now
    });

    sendSocketNotification(assignee.empId, notif.toObject());

    // Write AuditLog
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action: "Reassignment",
      context: ticketId,
      createdAt: now
    });

    return res.json(ticket);
  } catch (error: any) {
    console.error("Reassign ticket error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const { status, comment } = req.body;
    const performerEmpId = req.user?.empId;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    const prevStatus = ticket.currentStatus;
    const now = new Date();

    ticket.currentStatus = status;
    if (status === "Resolved") {
      ticket.resolvedAt = now;
    }
    if (status === "Closed") {
      ticket.closedAt = now;
    }

    await ticket.save();

    // Map log action type
    const action = status === "Closed" ? "Close" : status === "Resolved" ? "Resolve" : "Status Change";

    // Create TrailLog
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action,
      comment: comment || `Status changed to ${status}`,
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      previousStatus: prevStatus,
      currentStatus: status,
      createdAt: now
    });

    // Notify ticket owner (and assignee if changed by someone else)
    const notificationTargets = new Set<string>();
    if (performer.empId !== ticket.createdBy) notificationTargets.add(ticket.createdBy);
    if (performer.empId !== ticket.currentAssignee) notificationTargets.add(ticket.currentAssignee);

    for (const targetId of notificationTargets) {
      const notif = await Notification.create({
        id: crypto.randomUUID(),
        empId: targetId,
        title: "Status changed",
        description: `${ticketId} marked ${status}`,
        ticketId,
        read: false,
        createdAt: now
      });
      sendSocketNotification(targetId, notif.toObject());
    }

    // Write AuditLog
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action,
      context: ticketId,
      createdAt: now
    });

    return res.json(ticket);
  } catch (error: any) {
    console.error("Update status error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function listAssigneeTicketsSplit(req: AuthenticatedRequest, res: Response) {
  try {
    const { empId, kind, page = 1, pageSize = 10 } = req.query;

    if (!empId || !kind) {
      return res.status(400).json({ message: "empId and kind query parameters are required" });
    }

    const p = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    // Find all tickets currently assigned to empId
    const ownTickets = await Ticket.find({ currentAssignee: empId as string });

    let filteredTickets = ownTickets;

    if (kind === "new") {
      // Find ticketIds that the employee has acted on (i.e. left comment or changed status/reassigned)
      const actedTicketIds = await TrailLog.find({
        ticketId: { $in: ownTickets.map(t => t.ticketId) },
        performedBy: empId as string
      }).distinct("ticketId");

      // Filter out tickets that have been acted on
      filteredTickets = ownTickets.filter(t => !actedTicketIds.includes(t.ticketId));
    }

    // Sort by createdAt desc
    filteredTickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate manually
    const total = filteredTickets.length;
    const paginatedRows = filteredTickets.slice((p - 1) * size, (p - 1) * size + size);

    return res.json({
      rows: paginatedRows,
      total,
      page: p,
      pageSize: size
    });
  } catch (error: any) {
    console.error("List assignee tickets split error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
