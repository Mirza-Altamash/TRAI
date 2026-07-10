import { Response } from "express";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { Ticket, IAttachment } from "../models/Ticket";
import { Employee } from "../models/Employee";
import { TrailLog } from "../models/TrailLog";
import { Notification } from "../models/Notification";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { sendSocketNotification, getIO } from "../config/socket";

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

    const trailAttachments = Array.isArray(req.files) ? req.files.map(file => ({
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: creator.empId
    })) : [];

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
    console.log("Create Ticket trail: ticketId", ticketId);
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
      actorUserId: creator.empId,
      actorName: creator.name,
      actorRole: creator.role,
      actorDesignation: creator.designation || undefined,
      attachments: trailAttachments,
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

export function buildTicketMongoQuery(reqQuery: any, loggedInUser: any) {
  const {
    search,
    division,
    priority,
    type,
    status,
    assignee,
    createdBy,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    isPriority
  } = reqQuery;

  const query: any = {};

  // Search matches ticketId, summary, creator, assignee, division, type, status
  if (search) {
    const searchRegex = new RegExp(search as string, "i");
    query.$or = [
      { ticketId: searchRegex },
      { summary: searchRegex },
      { createdByName: searchRegex },
      { currentAssigneeName: searchRegex },
      { division: searchRegex },
      { type: searchRegex },
      { currentStatus: searchRegex }
    ];
  }

  if (division) query.division = division;
  if (priority) query.priority = priority;
  if (type) query.type = type;
  if (isPriority === "true") query.isPriority = true;
  if (isPriority === "false") query.isPriority = false;
  
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

  // Date range filters
  if (createdFrom || createdTo) {
    query.createdAt = {};
    if (createdFrom) query.createdAt.$gte = new Date(createdFrom as string);
    if (createdTo) {
      const toDate = new Date(createdTo as string);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  if (updatedFrom || updatedTo) {
    query.updatedAt = {};
    if (updatedFrom) query.updatedAt.$gte = new Date(updatedFrom as string);
    if (updatedTo) {
      const toDate = new Date(updatedTo as string);
      toDate.setHours(23, 59, 59, 999);
      query.updatedAt.$lte = toDate;
    }
  }

  // Enforce role permission guards
  if (loggedInUser && loggedInUser.role === "USER") {
    query.createdBy = loggedInUser.empId;
  }

  return query;
}

export async function listTickets(req: AuthenticatedRequest, res: Response) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const p = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    const query = buildTicketMongoQuery(req.query, req.user);

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort({ isPriority: -1, createdAt: -1 })
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

export async function exportExcelController(req: AuthenticatedRequest, res: Response) {
  try {
    const query = buildTicketMongoQuery(req.query, req.user);
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });

    const headers = [
      "Ticket ID",
      "Ticket Title / Subject",
      "Category / Department",
      "Current Status",
      "Assigned To",
      "Created Date & Time",
      "Resolved Date & Time",
      "Closed Date & Time",
      "Last Updated Date & Time"
    ];

    const dataRows = tickets.map((t) => {
      const formatTime = (d?: Date) => {
        if (!d) return "—";
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString("en-IN") + " " + dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      };
      return [
        t.ticketId,
        t.summary,
        `${t.division} / ${t.type}`,
        t.currentStatus,
        t.currentAssigneeName,
        formatTime(t.createdAt),
        formatTime(t.resolvedAt),
        formatTime(t.closedAt),
        formatTime(t.updatedAt)
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Calculate column widths dynamically
    ws["!cols"] = headers.map((h, colIndex) => {
      let maxLen = h.length;
      for (const row of dataRows) {
        const val = row[colIndex];
        if (val !== undefined && val !== null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      }
      return { wch: Math.min(Math.max(maxLen + 3, 12), 60) };
    });

    XLSX.utils.book_append_sheet(wb, ws, "My Tickets");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="my-tickets-export-${Date.now()}.xlsx"`);
    return res.send(buffer);
  } catch (error: any) {
    console.error("Export Excel error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function exportPdfController(req: AuthenticatedRequest, res: Response) {
  try {
    const query = buildTicketMongoQuery(req.query, req.user);
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="my-tickets-export-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(16).font("Helvetica-Bold").text("TRAI Complaint & Workflow Management Portal", 30, 30);
    doc.fontSize(12).font("Helvetica").text("My Tickets Export Summary", 30, 50);
    doc.fontSize(9).fillColor("#475569").text(`Generated By User: ${req.user?.empId} | Date: ${new Date().toLocaleString()}`, 30, 65);
    
    // Draw header border line
    doc.moveTo(30, 80).lineTo(811.89, 80).strokeColor("#cbd5e1").stroke();

    const startY = 95;
    let currentY = startY;

    // Table Headers
    const headers = [
      { name: "Ticket ID", width: 90 },
      { name: "Subject/Title", width: 160 },
      { name: "Category/Dept", width: 110 },
      { name: "Status", width: 60 },
      { name: "Assigned To", width: 100 },
      { name: "Created Date", width: 100 },
      { name: "Resolved Date", width: 80 },
      { name: "Closed Date", width: 80 }
    ];

    // Render Headers
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
    let currentX = 30;
    for (const h of headers) {
      doc.text(h.name, currentX, currentY, { width: h.width - 5 });
      currentX += h.width;
    }
    
    currentY += 15;
    doc.moveTo(30, currentY).lineTo(811.89, currentY).strokeColor("#94a3b8").stroke();
    currentY += 5;

    // Render Rows
    doc.font("Helvetica").fontSize(8).fillColor("#334155");
    for (const t of tickets) {
      if (currentY > 520) {
        doc.addPage();
        currentY = 30;
        // Re-render Headers on new page
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
        let tempX = 30;
        for (const h of headers) {
          doc.text(h.name, tempX, currentY, { width: h.width - 5 });
          tempX += h.width;
        }
        currentY += 15;
        doc.moveTo(30, currentY).lineTo(811.89, currentY).strokeColor("#94a3b8").stroke();
        currentY += 5;
        doc.font("Helvetica").fontSize(8).fillColor("#334155");
      }

      const formatTime = (d?: Date) => {
        if (!d) return "—";
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString("en-IN") + " " + dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      };

      const rowData = [
        t.ticketId,
        t.summary,
        `${t.division} / ${t.type}`,
        t.currentStatus,
        t.currentAssigneeName,
        formatTime(t.createdAt),
        formatTime(t.resolvedAt),
        formatTime(t.closedAt)
      ];

      let tempX = 30;
      let maxHeight = 10;
      
      const titleHeight = doc.heightOfString(t.summary, { width: 160 - 5 });
      if (titleHeight > maxHeight) maxHeight = titleHeight;

      for (let idx = 0; idx < rowData.length; idx++) {
        const textVal = rowData[idx];
        const colWidth = headers[idx].width;
        doc.text(textVal, tempX, currentY, { width: colWidth - 5 });
        tempX += colWidth;
      }

      currentY += maxHeight + 6;
      doc.moveTo(30, currentY).lineTo(811.89, currentY).strokeColor("#f1f5f9").stroke();
      currentY += 4;
    }

    doc.end();
  } catch (error: any) {
    console.error("Export PDF error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
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

    const attachments: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          url: `/uploads/trail-attachments/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: now,
          uploadedBy: performer.empId
        });
      }
    }

    // Create TrailLog
    console.log("Comment trail: ticketId", ticketId);
    const log = await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: "Comment",
      comment: comment.trim(),
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      currentStatus: ticket.currentStatus,
      attachments,
      actorUserId: performer.empId,
      actorName: performer.name,
      actorRole: performer.role,
      actorDesignation: performer.designation || undefined,
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

    const attachments: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          url: `/uploads/trail-attachments/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: now,
          uploadedBy: performer.empId
        });
      }
    }

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
    console.log("Reassign Ticket trail: ticketId", ticketId);
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
      attachments,
      actorUserId: performer.empId,
      actorName: performer.name,
      actorRole: performer.role,
      actorDesignation: performer.designation || undefined,
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

    if (ticket.currentStatus === "Closed") {
      return res.status(400).json({ message: "Closed tickets cannot be modified" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    if (performer.role === "L2" && performer.empId !== ticket.createdBy) {
      return res.status(403).json({ message: "L2 employees are not allowed to change ticket status" });
    }

    const prevStatus = ticket.currentStatus;
    const now = new Date();

    const attachments: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          url: `/uploads/trail-attachments/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: now,
          uploadedBy: performer.empId
        });
      }
    }

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
      console.log("Status Change trail: ticketId", ticketId);
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
        attachments,
        actorUserId: performer.empId,
        actorName: performer.name,
        actorRole: performer.role,
        actorDesignation: performer.designation || undefined,
        createdAt: now
      });

    } else if (status === "Closed") {
      if (prevStatus !== "Resolved") {
        return res.status(400).json({ message: "Only Resolved tickets can be Closed" });
      }

      const resolvedAtTime = ticket.resolvedAt ? ticket.resolvedAt.getTime() : ticket.createdAt.getTime();
      const daysDiff = (now.getTime() - resolvedAtTime) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 30) {
        if (performer.empId !== ticket.createdBy) {
          return res.status(403).json({ message: "Only the ticket creator can close this ticket within 30 days of resolution" });
        }

        ticket.currentStatus = "Closed";
        ticket.closedAt = now;
        ticket.isPriority = false;
        ticket.priorityMarkedBy = [];
        await ticket.save();

        console.log("Status Change trail: ticketId", ticketId);
        await TrailLog.create({
          id: crypto.randomUUID(),
          ticketId,
          action: "Priority Removed Automatically",
          comment: "Ticket closed; active priority flags cleared",
          performedBy: "System",
          performedByName: "System",
          performerRole: "ADMIN",
          previousStatus: "Resolved",
          currentStatus: "Closed",
          actorUserId: "System",
          actorName: "System",
          actorRole: "ADMIN",
          createdAt: now
        });

        await TrailLog.create({
          id: crypto.randomUUID(),
          ticketId,
          action: `Ticket Closed by ${performer.name}`,
          comment: comment.trim(),
          performedBy: performer.empId,
          performedByName: performer.name,
          performerRole: performer.role,
          previousStatus: prevStatus,
          currentStatus: "Closed",
          attachments,
          actorUserId: performer.empId,
          actorName: performer.name,
          actorRole: performer.role,
          actorDesignation: performer.designation || undefined,
          createdAt: now
        });

      } else {
        if (performer.role !== "L3" && performer.role !== "ADMIN") {
          return res.status(403).json({ message: "Only the assigned L3 member or Admin can close tickets after the 30-day review period" });
        }

        const assignedL3 = await getAssignedL3ForTicket(ticket);
        if (performer.role === "L3" && (!assignedL3 || performer.empId !== assignedL3.empId)) {
          return res.status(403).json({ message: "Only the assigned L3 member can close this ticket after 30 days" });
        }

        ticket.currentStatus = "Closed";
        ticket.closedAt = now;
        ticket.isPriority = false;
        ticket.priorityMarkedBy = [];
        await ticket.save();

        console.log("Status Change trail: ticketId", ticketId);
        await TrailLog.create({
          id: crypto.randomUUID(),
          ticketId,
          action: "Priority Removed Automatically",
          comment: "Ticket closed; active priority flags cleared",
          performedBy: "System",
          performedByName: "System",
          performerRole: "ADMIN",
          previousStatus: prevStatus,
          currentStatus: "Closed",
          actorUserId: "System",
          actorName: "System",
          actorRole: "ADMIN",
          createdAt: now
        });

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
          attachments,
          actorUserId: performer.empId,
          actorName: performer.name,
          actorRole: performer.role,
          actorDesignation: performer.designation || undefined,
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

    if (status === "Closed") {
      const io = getIO();
      if (io) {
        io.emit("ticket:priority-updated", {
          ticketId,
          ticketMongoId: ticket._id,
          action: "priority-cleared-on-close",
          markedByUserId: "System",
          remainingPriorityCount: 0,
          isPriority: false
        });
      }
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
    filteredTickets.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

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
    await TrailLog.deleteMany({ ticketId });

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

export async function getAssignedL3ForTicket(ticket: any) {
  const lastL3Log = await TrailLog.findOne({
    ticketId: ticket.ticketId,
    performerRole: "L3"
  }).sort({ createdAt: -1 });

  if (lastL3Log) {
    return { empId: lastL3Log.performedBy, name: lastL3Log.performedByName };
  }

  // Fallback to finding any L3 employee in the division
  const defaultL3 = await Employee.findOne({ role: "L3", division: ticket.division, isActive: true });
  if (defaultL3) {
    return { empId: defaultL3.empId, name: defaultL3.name };
  }

  // Fallback to any active L3 employee
  const fallbackL3 = await Employee.findOne({ role: "L3", isActive: true });
  if (fallbackL3) {
    return { empId: fallbackL3.empId, name: fallbackL3.name };
  }

  return null;
}

export async function reopenTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const { comment } = req.body;
    const performerEmpId = req.user?.empId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required to reopen the ticket" });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.currentStatus !== "Resolved") {
      return res.status(400).json({ message: "Only Resolved tickets can be reopened" });
    }

    const performer = await Employee.findOne({ empId: performerEmpId });
    if (!performer) {
      return res.status(400).json({ message: "Performer employee not found" });
    }

    // Check if caller is ticket creator
    if (performer.empId !== ticket.createdBy) {
      return res.status(403).json({ message: "Only the ticket creator can reopen this ticket" });
    }

    // Check if within 30 days of resolution
    const resolvedAtTime = ticket.resolvedAt ? ticket.resolvedAt.getTime() : ticket.createdAt.getTime();
    const now = new Date();
    const daysDiff = (now.getTime() - resolvedAtTime) / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      return res.status(400).json({ message: "Cannot reopen ticket after 30 days of resolution" });
    }

    const attachments: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          url: `/uploads/trail-attachments/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: now,
          uploadedBy: performer.empId
        });
      }
    }

    // Find the previous/assigned L3 member
    const assignedL3 = await getAssignedL3ForTicket(ticket);
    if (!assignedL3) {
      return res.status(400).json({ message: "No L3 supervisor found to assign the reopened ticket to" });
    }

    const l3Assignee = await Employee.findOne({ empId: assignedL3.empId });
    if (!l3Assignee) {
      return res.status(400).json({ message: "Assigned L3 member no longer exists" });
    }

    const prevStatus = ticket.currentStatus;

    // Update ticket: status Open, clear resolvedAt, assign to L3
    ticket.currentAssignee = l3Assignee.empId;
    ticket.currentAssigneeName = l3Assignee.name;
    ticket.currentAssigneeRole = l3Assignee.role;
    ticket.currentStatus = "Open";
    ticket.assignedAt = now;
    ticket.resolvedAt = undefined;
    await ticket.save();

    // Create TrailLog
    console.log("Reopen Ticket trail: ticketId", ticketId);
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: `Ticket Reopened and Assigned to ${l3Assignee.name}`,
      comment: comment.trim(),
      performedBy: performer.empId,
      performedByName: performer.name,
      performerRole: performer.role,
      toAssignee: l3Assignee.empId,
      previousStatus: prevStatus,
      currentStatus: "Open",
      attachments,
      actorUserId: performer.empId,
      actorName: performer.name,
      actorRole: performer.role,
      actorDesignation: performer.designation || undefined,
      createdAt: now
    });

    // Notify new assignee (L3)
    const notif = await Notification.create({
      id: crypto.randomUUID(),
      empId: l3Assignee.empId,
      title: "Ticket reopened",
      description: `${ticketId} has been reopened and assigned to you`,
      ticketId,
      read: false,
      createdAt: now
    });
    sendSocketNotification(l3Assignee.empId, notif.toObject());

    // Write AuditLog
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: performer.empId,
      empName: performer.name,
      role: performer.role,
      action: "Status Change",
      context: ticketId,
      createdAt: now
    });

    return res.json(ticket);
  } catch (error: any) {
    console.error("Reopen ticket error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
