import { Schema, model, Document } from "mongoose";

export interface IEmployee extends Document {
  empId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER" | "L2" | "L3";
  subRole: string | null;
  division: string;
  designation: string;
  floor: string;
  orderRank: number;
  mustChangePassword: boolean;
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
    division: { type: String, required: true },
    designation: { type: String, required: true },
    floor: { type: String, required: true, default: "N/A" },
    orderRank: { type: Number, required: true, default: 99 },
    mustChangePassword: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Employee = model<IEmployee>("Employee", EmployeeSchema);
