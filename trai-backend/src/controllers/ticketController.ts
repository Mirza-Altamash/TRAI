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
    const { division, priority, type, portalName, portalUrl, reportName, summary, description, assigneeEmpId, comment } = req.body;
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
      currentStatus: "Open", // Directly assigned on creation, status is Open
      createdBy: creator.empId,
      createdByName: creator.name,
      assignedAt: now,
      autoCloseEligible: true
    });

    const roleString = assignee.subRole ? ` (${assignee.role} ${assignee.subRole})` : ` (${assignee.role})`;

    // Create TrailLog for creation & initial assignment
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: `Ticket Created and Assigned to ${assignee.name}${roleString}`,
      comment: comment?.trim() || description,
      performedBy: creator.empId,
      performedByName: creator.name,
      performerRole: creator.role,
      toAssignee: assignee.empId,
      currentStatus: "Open",
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
    if (status) {
      if (status === "Assigned") {
        query.currentStatus = "Open";
        query.currentAssigneeRole = { $in: ["L2", "L3"] };
      } else {
        query.currentStatus = status;
      }
    }
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
    const { toEmpId, comment } = req.body;
    const performerEmpId = req.user?.empId;

    if (!toEmpId) {
      return res.status(400).json({ message: "Assignee ID is required" });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required for this action" });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.currentStatus === "Closed") {
      return res.status(400).json({ message: "Cannot reassign a closed ticket" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    if (performer.role === "USER") {
      return res.status(403).json({ message: "Users are not allowed to reassign tickets" });
    }

    const assignee = await Employee.findOne({ empId: toEmpId });
    if (!assignee) {
      return res.status(400).json({ message: "Target assignee employee not found" });
    }

    if (performer.role === "L2" && assignee.role === "USER") {
      return res.status(400).json({ message: "L2 members can only assign to L2 or L3 employees" });
    }
    if (performer.role === "L3" && assignee.role === "USER") {
      return res.status(400).json({ message: "L3 members can only assign to L2 or L3 employees" });
    }

    const prevName = ticket.currentAssigneeName;
    const prevEmpId = ticket.currentAssignee;
    const prevStatus = ticket.currentStatus;
    const now = new Date();

    // Update ticket assignee and ensure status is Open
    ticket.currentAssignee = assignee.empId;
    ticket.currentAssigneeName = assignee.name;
    ticket.currentAssigneeRole = assignee.role;
    ticket.currentStatus = "Open";
    ticket.assignedAt = now;
    await ticket.save();

    let actionText = `Ticket Reassigned to ${assignee.name} (${assignee.role}${assignee.subRole ? ' ' + assignee.subRole : ''})`;
    if (performer.role === "L3" && assignee.role === "L2") {
      actionText = `Ticket Assigned to ${assignee.name} (${assignee.role}${assignee.subRole ? ' ' + assignee.subRole : ''})`;
    }

    // Create TrailLog for reassignment
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: actionText,
      comment: comment.trim(),
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      fromAssignee: prevEmpId,
      toAssignee: assignee.empId,
      previousStatus: prevStatus,
      currentStatus: "Open",
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

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required for this action" });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    if (performer.role === "L2") {
      return res.status(403).json({ message: "L2 employees are not allowed to change ticket status" });
    }

    const prevStatus = ticket.currentStatus;
    const now = new Date();

    if (status === "Resolved") {
      if (prevStatus !== "Open") {
        return res.status(400).json({ message: "Only Open tickets can be marked as Resolved" });
      }
      if (performer.role !== "L3" && performer.role !== "ADMIN") {
        return res.status(403).json({ message: "Only L3 members can resolve tickets" });
      }

      const creator = await Employee.findOne({ empId: ticket.createdBy });
      if (!creator) {
        return res.status(400).json({ message: "Ticket creator employee not found" });
      }

      ticket.currentAssignee = creator.empId;
      ticket.currentAssigneeName = creator.name;
      ticket.currentAssigneeRole = creator.role;
      ticket.currentStatus = "Resolved";
      ticket.resolvedAt = now;
      await ticket.save();

      const actionText = `Ticket Resolved and Assigned to ${creator.name}`;
      await TrailLog.create({
        id: crypto.randomUUID(),
        ticketId,
        action: actionText,
        comment: comment.trim(),
        performedBy: performer.empId,
        performedByName: performer.name,
        performerRole: performer.role,
        toAssignee: creator.empId,
        previousStatus: prevStatus,
        currentStatus: "Resolved",
        createdAt: now
      });

    } else if (status === "Closed") {
      if (prevStatus !== "Resolved") {
        return res.status(400).json({ message: "Only Resolved tickets can be Closed" });
      }

      const resolvedAtTime = ticket.resolvedAt ? ticket.resolvedAt.getTime() : ticket.createdAt.getTime();
      const daysDiff = (now.getTime() - resolvedAtTime) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 15) {
        if (performer.empId !== ticket.createdBy) {
          return res.status(403).json({ message: "Only the ticket creator can close this ticket within 15 days of resolution" });
        }

        ticket.currentStatus = "Closed";
        ticket.closedAt = now;
        await ticket.save();

        await TrailLog.create({
          id: crypto.randomUUID(),
          ticketId,
          action: "Ticket Closed by User",
          comment: comment.trim(),
          performedBy: performer.empId,
          performedByName: performer.name,
          performerRole: performer.role,
          previousStatus: prevStatus,
          currentStatus: "Closed",
          createdAt: now
        });

      } else {
        if (performer.role !== "L3" && performer.role !== "ADMIN") {
          return res.status(403).json({ message: "Only L3 members can close tickets after the 15-day review period" });
        }

        ticket.currentStatus = "Closed";
        ticket.closedAt = now;
        await ticket.save();

        await TrailLog.create({
          id: crypto.randomUUID(),
          ticketId,
          action: "Ticket Closed Due to User Inaction",
          comment: comment.trim(),
          performedBy: performer.empId,
          performedByName: performer.name,
          performerRole: performer.role,
          previousStatus: prevStatus,
          currentStatus: "Closed",
          createdAt: now
        });
      }
    } else {
      return res.status(400).json({ message: "Invalid status transition" });
    }

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

    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action: status === "Closed" ? "Close" : "Resolve",
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

export async function deleteTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await Ticket.deleteOne({ ticketId });

    // Write AuditLog
    if (req.user) {
      const performer = await Employee.findOne({ empId: req.user.empId });
      await AuditLog.create({
        id: crypto.randomUUID(),
        empId: req.user.empId,
        empName: performer?.name || "System Admin",
        role: req.user.role,
        action: "Ticket Delete",
        context: ticketId,
        createdAt: new Date()
      });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
