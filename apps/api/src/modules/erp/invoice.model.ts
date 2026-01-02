import mongoose from "mongoose";

export interface InvoiceDoc extends mongoose.Document {
  dealId: string | mongoose.Types.ObjectId;
  beloppSEK: number;
  status: "UTKAST" | "SKICKAD" | "BETALD";
  forfallodatum: Date;
  skapad: Date;
}

const InvoiceSchema = new mongoose.Schema<InvoiceDoc>(
  {
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "deals", required: true, index: true },
    beloppSEK: { type: Number, required: true },
    status: { type: String, required: true, enum: ["UTKAST", "SKICKAD", "BETALD"], default: "UTKAST" },
    forfallodatum: { type: Date, required: true },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const InvoiceModel = mongoose.model<InvoiceDoc>("invoices", InvoiceSchema);
