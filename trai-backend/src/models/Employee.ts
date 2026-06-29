import { Schema, model, Document } from "mongoose";

export interface IEmployee extends Document {
  empId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER" | "L2" | "L3";
  subRole: "Developer" | "Infra" | "Network" | "SRO" | "J.Adv" | "D.Adv" | "Adv" | null;
  division: "IT" | "NSL" | "QoS" | "B&CS" | "F&EA" | "ALL";
  designation: string;
  floor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    empId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["ADMIN", "USER", "L2", "L3"] },
    subRole: { type: String, default: null },
    division: { type: String, required: true, enum: ["IT", "NSL", "QoS", "B&CS", "F&EA", "ALL"] },
    designation: { type: String, required: true },
    floor: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Employee = model<IEmployee>("Employee", EmployeeSchema);
