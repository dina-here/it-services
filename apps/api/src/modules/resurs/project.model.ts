import mongoose from "mongoose";

export interface ProjectDoc extends mongoose.Document {
  projectKey?: string;
  accountId: string | mongoose.Types.ObjectId;
  namn: string;
  start: Date;
  slut?: Date;
  skapad: Date;
}

const ProjectSchema = new mongoose.Schema<ProjectDoc>(
  {
    projectKey: { type: String, unique: true, sparse: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true, index: true },
    namn: { type: String, required: true },
    start: { type: Date, required: true },
    slut: { type: Date, required: false },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const ProjectModel = mongoose.model<ProjectDoc>("projects", ProjectSchema);
