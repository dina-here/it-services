import mongoose from "mongoose";

export interface ContactDoc extends mongoose.Document {
  accountId: string | mongoose.Types.ObjectId;
  namn: string;
  epost: string;
  titel: string;
  skapad: Date;
}

const ContactSchema = new mongoose.Schema<ContactDoc>(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true, index: true },
    namn: { type: String, required: true },
    epost: { type: String, required: true, index: true },
    titel: { type: String, required: true },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const ContactModel = mongoose.model<ContactDoc>("contacts", ContactSchema);
