import cron from "node-cron";
import crypto from "crypto";
import { Ticket } from "../models/Ticket";
import { TrailLog } from "../models/TrailLog";
import { Notification } from "../models/Notification";
import { sendSocketNotification } from "../config/socket";

// Auto-closes tickets that have been in "Resolved" state for more than 5 days
export async function performAutoClose() {
  console.log("Running auto-close resolved tickets job...");
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Find tickets resolved more than 5 days ago and not yet closed
    const ticketsToClose = await Ticket.find({
      currentStatus: "Resolved",
      resolvedAt: { $lte: fiveDaysAgo },
      autoCloseEligible: { $ne: false }
    });

    if (ticketsToClose.length === 0) {
      console.log("No resolved tickets eligible for auto-close.");
      return;
    }

    console.log(`Found ${ticketsToClose.length} resolved tickets to auto-close.`);
    const now = new Date();

    for (const ticket of ticketsToClose) {
      const prevStatus = ticket.currentStatus;
      ticket.currentStatus = "Closed";
      ticket.closedAt = now;
      await ticket.save();

      // Create TrailLog
      await TrailLog.create({
        id: crypto.randomUUID(),
        ticketId: ticket.ticketId,
        action: "Close",
        comment: "System auto-closed resolved ticket (SLA policy).",
        performedBy: "TRAI-ADM-001",
        performedByName: "System",
        performerRole: "ADMIN",
        previousStatus: prevStatus,
        currentStatus: "Closed",
        createdAt: now
      });

      // Notify ticket owner
      const notif = await Notification.create({
        id: crypto.randomUUID(),
        empId: ticket.createdBy,
        title: "Ticket auto-closed",
        description: `${ticket.ticketId} auto-closed after 5 days in Resolved status`,
        ticketId: ticket.ticketId,
        read: false,
        createdAt: now
      });

      sendSocketNotification(ticket.createdBy, notif.toObject());
      console.log(`Auto-closed ticket: ${ticket.ticketId}`);
    }
  } catch (error) {
    console.error("Error running auto-close job:", error);
  }
}

export function startAutoCloseJob() {
  // Run once on startup
  performAutoClose();

  // Then schedule to run every day at midnight: '0 0 * * *'
  cron.schedule("0 0 * * *", () => {
    performAutoClose();
  });
  console.log("Auto-close background job scheduled (runs daily at midnight).");
}
