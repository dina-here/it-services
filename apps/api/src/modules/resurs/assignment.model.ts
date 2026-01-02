import mongoose from "mongoose";

export interface AssignmentDoc extends mongoose.Document {
  employeeId: string | mongoose.Types.ObjectId;
  projectId: string | mongoose.Types.ObjectId;
  belaggningPct: number;
  fran: Date;
  till: Date;
  skapad: Date;
}

const AssignmentSchema = new mongoose.Schema<AssignmentDoc>(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employees", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true, index: true },
    belaggningPct: { type: Number, required: true, min: 0, max: 100 },
    fran: { type: Date, required: true },
    till: { type: Date, required: true },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const AssignmentModel = mongoose.model<AssignmentDoc>("assignments", AssignmentSchema);
