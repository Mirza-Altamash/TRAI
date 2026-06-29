import { Schema, model, Document } from "mongoose";

export interface IAuditLog extends Document {
  id: string; // uuid
  empId: string;
  empName: string;
  role: "ADMIN" | "USER" | "L2" | "L3";
  action: "Login" | "Logout" | "Password Change" | "Employee Create" | "Employee Update" | "Employee Delete" | "Ticket Create" | "Assignment" | "Reassignment" | "Comment" | "Status Change" | "Resolve" | "Close" | "Export";
  context?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  id: { type: String, required: true, unique: true },
  empId: { type: String, required: true, index: true },
  empName: { type: String, required: true },
  role: { type: String, required: true, enum: ["ADMIN", "USER", "L2", "L3"] },
  action: {
    type: String,
    required: true,
    enum: [
      "Login", "Logout", "Password Change",
      "Employee Create", "Employee Update", "Employee Delete",
      "Ticket Create", "Assignment", "Reassignment", "Comment",
      "Status Change", "Resolve", "Close", "Export"
    ]
  },
  context: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
