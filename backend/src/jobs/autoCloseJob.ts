import cron from "node-cron";
import crypto from "crypto";
import { Ticket } from "../models/Ticket";
import { TrailLog } from "../models/TrailLog";
import { Notification } from "../models/Notification";
import { sendSocketNotification } from "../config/socket";

// Auto-closes tickets that have been in "Resolved" state for more than 5 days
export async function performAutoClose() {
  console.log("Running auto-close eligibility check... (Manual closure enforced)");
  // Resolved tickets are now closed manually from the UI/API.
  // We do not auto-close tickets silently anymore.
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
