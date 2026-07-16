import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { connectDB } from "../config/db";
import { Employee } from "../models/Employee";
import { Ticket } from "../models/Ticket";
import { TrailLog } from "../models/TrailLog";
import { Notification } from "../models/Notification";
import { AuditLog } from "../models/AuditLog";
import { hashPassword } from "./authService";

function iso(daysAgo: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

const DIVISIONS = ["IT", "NSL", "QoS", "B&CS", "F&EA"] as const;
const PRIORITIES = ["Normal", "Medium", "High"] as const;
const TICKET_TYPES = ["New Development", "Modification", "Reports"] as const;
const STATUSES = ["Open", "Resolved", "Closed"] as const;

export async function seedDatabase() {
  console.log("Seeding database...");

  // Check if database is already seeded to prevent accidental wipes in production
  const existingEmployeeCount = await Employee.countDocuments();
  if (existingEmployeeCount > 0) {
    console.log("Database is already seeded. Skipping seed process to protect existing data.");
    return;
  }

  // Clear existing data (only if empty to avoid partial states)
  await Employee.deleteMany({});
  await Ticket.deleteMany({});
  await TrailLog.deleteMany({});
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});

  const defaultPassword = "12345";
  const defaultPasswordHash = await hashPassword(defaultPassword);

  const jsonPath = path.join(__dirname, "employees.json");
  const initialEmployees = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const seededEmployees = [];

  for (const emp of initialEmployees) {
    const created = await Employee.create({
      ...emp,
      passwordHash: defaultPasswordHash,
      createdAt: iso(120),
      updatedAt: iso(10)
    });
    seededEmployees.push(created);
  }



  console.log(`Seeded ${seededEmployees.length} employees successfully.`);

  const users = seededEmployees.filter(e => e.role === "USER");
  const handlers = seededEmployees.filter(e => e.role === "L2" || e.role === "L3");
  const summaries = [
    "New portal for spectrum allocation",
    "Modify dashboard filters",
    "Generate consumer complaints report",
    "API access for compliance data",
    "Network latency investigation",
    "Quarterly tariff analytics report",
    "Bug in attachment upload",
    "Add bulk import feature",
  ];
  const ticketStatuses = ["Open", "Open", "Open", "Closed", "Closed", "Closed"];

  let ticketSeq = 1;

  for (let i = 0; i < 42; i++) {
    const daysAgo = 60 - i;
    const createdBy = users[i % users.length];
    const assignee = handlers[i % handlers.length];
    const div = DIVISIONS[i % DIVISIONS.length];
    const prio = PRIORITIES[i % PRIORITIES.length];
    const type = TICKET_TYPES[i % TICKET_TYPES.length];
    const status = ticketStatuses[i % ticketStatuses.length];
    const summary = summaries[i % summaries.length];

    const year = new Date().getFullYear();
    const ticketId = `TRAI-${year}-${String(ticketSeq++).padStart(4, "0")}`;
    const createdAt = iso(daysAgo);
    const closedAt = status === "Closed" ? iso(Math.max(0, daysAgo - 4)) : undefined;

    const t = await Ticket.create({
      ticketId,
      division: div,
      priority: prio,
      type,
      portalName: type !== "New Development" ? "TRAI Compliance Portal" : undefined,
      portalUrl: type !== "New Development" ? "https://compliance.trai.gov.in" : undefined,
      reportName: type === "Reports" ? "Quarterly QoS Report" : undefined,
      summary,
      description: `Detailed requirement for ${summary}. Please review and proceed accordingly.`,
      attachments: [],
      currentAssignee: assignee.empId,
      currentAssigneeName: assignee.name,
      currentAssigneeRole: assignee.role,
      currentStatus: status,
      createdBy: createdBy.empId,
      createdByName: createdBy.name,
      createdAt,
      assignedAt: createdAt,
      resolvedAt: status !== "Open" ? iso(Math.max(0, daysAgo - 5)) : undefined,
      closedAt,
      autoCloseEligible: status === "Closed" ? false : true
    });

    const roleString = assignee.subRole ? ` (${assignee.role} ${assignee.subRole})` : ` (${assignee.role})`;
    await TrailLog.create({
      id: crypto.randomUUID(),
      ticketId,
      action: `Ticket Created and Assigned to ${assignee.name}${roleString}`,
      comment: summary,
      performedBy: createdBy.empId,
      performedByName: createdBy.name,
      performerRole: createdBy.role,
      currentStatus: "Open",
      actorUserId: createdBy.empId,
      actorName: createdBy.name,
      actorRole: createdBy.role,
      actorDesignation: createdBy.designation || undefined,
      createdAt
    });

    if (status === "Resolved") {
      const resolvedAt = iso(Math.max(0, daysAgo - 5));
      await TrailLog.create({
        id: crypto.randomUUID(),
        ticketId,
        action: `Ticket Resolved and Assigned to ${createdBy.name}`,
        comment: "Problem resolved successfully and ready for verification",
        performedBy: assignee.empId,
        performedByName: assignee.name,
        performerRole: assignee.role,
        currentStatus: "Resolved",
        actorUserId: assignee.empId,
        actorName: assignee.name,
        actorRole: assignee.role,
        actorDesignation: assignee.designation || undefined,
        createdAt: resolvedAt
      });
    }

    if (status === "Closed") {
      const resolvedAt = iso(Math.max(0, daysAgo - 5));
      await TrailLog.create({
        id: crypto.randomUUID(),
        ticketId,
        action: `Ticket Resolved and Assigned to ${createdBy.name}`,
        comment: "Problem resolved successfully and ready for verification",
        performedBy: assignee.empId,
        performedByName: assignee.name,
        performerRole: assignee.role,
        currentStatus: "Resolved",
        actorUserId: assignee.empId,
        actorName: assignee.name,
        actorRole: assignee.role,
        actorDesignation: assignee.designation || undefined,
        createdAt: resolvedAt
      });

      await TrailLog.create({
        id: crypto.randomUUID(),
        ticketId,
        action: "Ticket Closed by User",
        comment: "Working as expected",
        performedBy: createdBy.empId,
        performedByName: createdBy.name,
        performerRole: createdBy.role,
        previousStatus: "Resolved",
        currentStatus: "Closed",
        actorUserId: createdBy.empId,
        actorName: createdBy.name,
        actorRole: createdBy.role,
        actorDesignation: createdBy.designation || undefined,
        createdAt: closedAt
      });
    }
  }

  console.log(`Seeded ${ticketSeq - 1} tickets and trail logs successfully.`);

  // Seed Audit Logs
  const ticketsList = await Ticket.find({});
  for (let i = 0; i < 25; i++) {
    const e = seededEmployees[i % seededEmployees.length];
    const actions = ["Login", "Ticket Create", "Comment", "Status Change", "Assignment", "Export", "Logout"] as const;
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: e.empId,
      empName: e.name,
      role: e.role,
      action: actions[i % actions.length],
      context: i % 3 === 0 ? ticketsList[i % ticketsList.length]?.ticketId : undefined,
      createdAt: iso(i % 30, 9 + (i % 9))
    });
  }

  // Seed Notifications
  if (ticketsList.length > 5) {
    await Notification.create({
      id: crypto.randomUUID(),
      empId: "TRAI-L2-001",
      title: "Ticket assigned",
      description: `${ticketsList[0].ticketId} assigned to you`,
      ticketId: ticketsList[0].ticketId,
      createdAt: iso(0, 14),
      read: false
    });

    await Notification.create({
      id: crypto.randomUUID(),
      empId: ticketsList[2].createdBy,
      title: "Status changed",
      description: `${ticketsList[2].ticketId} marked Resolved`,
      ticketId: ticketsList[2].ticketId,
      createdAt: iso(0, 11),
      read: false
    });

    await Notification.create({
      id: crypto.randomUUID(),
      empId: ticketsList[4].createdBy,
      title: "Comment added",
      description: `New comment on ${ticketsList[4].ticketId}`,
      ticketId: ticketsList[4].ticketId,
      createdAt: iso(1, 17),
      read: true
    });

    await Notification.create({
      id: crypto.randomUUID(),
      empId: "TRAI-USR-001",
      title: "Status changed",
      description: `${ticketsList[0].ticketId} marked Resolved`,
      ticketId: ticketsList[0].ticketId,
      createdAt: iso(0, 8),
      read: false
    });
  }

  console.log("Database seeded successfully!");
}

// Standalone execution support
if (require.main === module) {
  connectDB().then(async () => {
    await seedDatabase();
    await mongoose.disconnect();
    console.log("Database disconnected.");
    process.exit(0);
  }).catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
