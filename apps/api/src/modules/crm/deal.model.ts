import mongoose from "mongoose";

export interface DealDoc extends mongoose.Document {
  dealKey?: string;
  accountId: string | mongoose.Types.ObjectId;
  namn: string;
  vardeSEK: number;
  fas: "PROSPEKT" | "MOTE" | "OFFERT" | "VUNNEN" | "FORLORAD";
  sannolikhet: number;
  agareEmployeeId: string;
  forvantatAvslut: Date;
  skapad: Date;
}

const DealSchema = new mongoose.Schema<DealDoc>(
  {
    dealKey: { type: String, unique: true, sparse: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true, index: true },
    namn: { type: String, required: true },
    vardeSEK: { type: Number, required: true },
    fas: { type: String, required: true, enum: ["PROSPEKT", "MOTE", "OFFERT", "VUNNEN", "FORLORAD"], default: "PROSPEKT" },
    sannolikhet: { type: Number, required: true, min: 0, max: 100, default: 20 },
    agareEmployeeId: { type: String, required: true, index: true },
    forvantatAvslut: { type: Date, required: true },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const DealModel = mongoose.model<DealDoc>("deals", DealSchema);
