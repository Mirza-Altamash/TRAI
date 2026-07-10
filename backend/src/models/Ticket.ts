import { Schema, model, Document } from "mongoose";

export interface IAttachment {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: Date;
}

export interface ITicket extends Document {
  ticketId: string;
  division: "IT" | "NSL" | "QoS" | "B&CS" | "F&EA";
  priority: "Normal" | "Medium" | "High";
  type: "New Development" | "Modification" | "Reports";
  portalName?: string;
  portalUrl?: string;
  reportName?: string;
  summary: string;
  description: string;
  attachments: IAttachment[];
  currentAssignee: string; // empId
  currentAssigneeName: string;
  currentAssigneeRole: "ADMIN" | "USER" | "L2" | "L3";
  currentStatus: "Open" | "Resolved" | "Closed";
  createdBy: string; // empId
  createdByName: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  autoCloseEligible?: boolean;
  createdAt: Date;
  updatedAt: Date;
  isPriority?: boolean;
  priorityMarkedBy?: {
    userId: string;
    name: string;
    role: string;
    subrole?: string;
    reason?: string;
    markedAt: Date;
  }[];
}

const AttachmentSchema = new Schema<IAttachment>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sizeKb: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    division: { type: String, required: true, enum: ["IT", "NSL", "QoS", "B&CS", "F&EA"] },
    priority: { type: String, required: true, enum: ["Normal", "Medium", "High"] },
    type: { type: String, required: true, enum: ["New Development", "Modification", "Reports"] },
    portalName: { type: String },
    portalUrl: { type: String },
    reportName: { type: String },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    attachments: [AttachmentSchema],
    currentAssignee: { type: String, required: true, index: true },
    currentAssigneeName: { type: String, required: true },
    currentAssigneeRole: { type: String, required: true, enum: ["ADMIN", "USER", "L2", "L3"] },
    currentStatus: { type: String, required: true, enum: ["Open", "Resolved", "Closed"], default: "Open" },
    createdBy: { type: String, required: true, index: true },
    createdByName: { type: String, required: true },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    autoCloseEligible: { type: Boolean, default: false },
    isPriority: { type: Boolean, default: false },
    priorityMarkedBy: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        subrole: { type: String },
        reason: { type: String },
        markedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Ticket = model<ITicket>("Ticket", TicketSchema);
