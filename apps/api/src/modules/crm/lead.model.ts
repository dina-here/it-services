import mongoose from "mongoose";

export interface LeadDoc extends mongoose.Document {
  namn: string;
  epost: string;
  kalla: string;
  status: "NY" | "KONTAKTAD" | "KVALIFICERAD" | "AVSLUTAD";
  skapad: Date;
}

const LeadSchema = new mongoose.Schema<LeadDoc>(
  {
    namn: { type: String, required: true },
    epost: { type: String, required: true, index: true },
    kalla: { type: String, required: true },
    status: { type: String, required: true, enum: ["NY", "KONTAKTAD", "KVALIFICERAD", "AVSLUTAD"], default: "NY" },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const LeadModel = mongoose.model<LeadDoc>("leads", LeadSchema);
