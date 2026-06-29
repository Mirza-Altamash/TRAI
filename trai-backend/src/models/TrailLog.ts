import { Schema, model, Document } from "mongoose";
import { IAttachment } from "./Ticket";

export interface ITrailLog extends Document {
  id: string; // matches uuid generated/expected by front-end
  ticketId: string;
  action: "Ticket Created" | "Assignment" | "Reassignment" | "Comment" | "Status Change" | "Resolve" | "Close" | "Export";
  comment?: string;
  performedBy: string; // empId
  performedByName: string;
  performerRole: "ADMIN" | "USER" | "L2" | "L3";
  fromAssignee?: string;
  toAssignee?: string;
  previousStatus?: "Open" | "Assigned" | "Resolved" | "Closed";
  currentStatus?: "Open" | "Assigned" | "Resolved" | "Closed";
  attachment?: IAttachment;
  createdAt: Date;
}

const TrailLogSchema = new Schema<ITrailLog>({
  id: { type: String, required: true, unique: true },
  ticketId: { type: String, required: true, index: true },
  action: {
    type: String,
    required: true,
    enum: ["Ticket Created", "Assignment", "Reassignment", "Comment", "Status Change", "Resolve", "Close", "Export"]
  },
  comment: { type: String },
  performedBy: { type: String, required: true },
  performedByName: { type: String, required: true },
  performerRole: { type: String, required: true, enum: ["ADMIN", "USER", "L2", "L3"] },
  fromAssignee: { type: String },
  toAssignee: { type: String },
  previousStatus: { type: String, enum: ["Open", "Assigned", "Resolved", "Closed"] },
  currentStatus: { type: String, enum: ["Open", "Assigned", "Resolved", "Closed"] },
  attachment: {
    id: String,
    name: String,
    sizeKb: Number,
    uploadedAt: Date
  },
  createdAt: { type: Date, default: Date.now }
});

export const TrailLog = model<ITrailLog>("TrailLog", TrailLogSchema);
