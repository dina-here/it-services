import mongoose from "mongoose";

export interface ProjectDoc extends mongoose.Document {
  projectKey?: string;
  dealId?: string | mongoose.Types.ObjectId;
  accountId: string | mongoose.Types.ObjectId;
  namn?: string;
  start: Date;
  slut?: Date;
  status: string;
  skapad: Date;
}

const ProjectSchema = new mongoose.Schema<ProjectDoc>(
  {
    projectKey: { type: String, unique: true, sparse: true },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "deals", sparse: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true, index: true },
    namn: { type: String, required: false },
    start: { type: Date, required: true },
    slut: { type: Date, required: false },
    status: { type: String, enum: ["BEKRÄFTAD", "PLANERING", "BEMANNING", "SLUTFÖRD"], default: "BEKRÄFTAD" },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const ProjectModel = mongoose.model<ProjectDoc>("projects", ProjectSchema);
