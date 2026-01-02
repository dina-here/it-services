import mongoose from "mongoose";

export interface EmployeeDoc extends mongoose.Document {
  employeeKey?: string;
  namn: string;
  epost: string;
  roll: "KONSULT" | "SALJ" | "HR" | "TEKNIKCHEF" | "VD";
  kompetenser: string[];
  startdatum: Date;
  status: "AKTIV" | "ONBOARDING" | "OFFBOARDING" | "UPPSAGD";
  skapad: Date;
}

const EmployeeSchema = new mongoose.Schema<EmployeeDoc>(
  {
    employeeKey: { type: String, unique: true, sparse: true },
    namn: { type: String, required: true, index: true },
    epost: { type: String, required: true, unique: true, lowercase: true, index: true },
    roll: { type: String, required: true, enum: ["KONSULT", "SALJ", "HR", "TEKNIKCHEF", "VD"] },
    kompetenser: { type: [String], required: true, default: [] },
    startdatum: { type: Date, required: true },
    status: { type: String, required: true, enum: ["AKTIV", "ONBOARDING", "OFFBOARDING", "UPPSAGD"], default: "AKTIV" },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const EmployeeModel = mongoose.model<EmployeeDoc>("employees", EmployeeSchema);
