import { Schema, model, Document } from "mongoose";

export interface INotification extends Document {
  id: string; // uuid
  empId: string; // Recipient employee id
  title: string;
  description: string;
  ticketId?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  id: { type: String, required: true, unique: true },
  empId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  ticketId: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = model<INotification>("Notification", NotificationSchema);
