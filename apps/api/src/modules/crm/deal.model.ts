import mongoose from "mongoose";

export interface DealDoc extends mongoose.Document {
  dealKey?: string;
  accountId: string | mongoose.Types.ObjectId;
  namn: string;
  vardeSEK: number;
  fas: "PROSPEKT" | "MOTE" | "OFFERT" | "VUNNEN" | "FORLORAD";
  sannolikhet: number;
  agareEmployeeId?: string;
  forvantatAvslut: Date;
  kontaktLeadId?: string | mongoose.Types.ObjectId;
  kontaktNamn?: string;
  kontaktEpost?: string;
  kontaktTitel?: string;
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
    agareEmployeeId: { type: String, required: false, index: true },
    forvantatAvslut: { type: Date, required: true },
    kontaktLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "leads", required: false },
    kontaktNamn: { type: String, required: false },
    kontaktEpost: { type: String, required: false },
    kontaktTitel: { type: String, required: false },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const DealModel = mongoose.model<DealDoc>("deals", DealSchema);
