import mongoose from "mongoose";

export interface AccountDoc extends mongoose.Document {
  accountKey?: string;
  namn: string;
  bransch: string;
  skapad: Date;
}

const AccountSchema = new mongoose.Schema<AccountDoc>(
  {
    accountKey: { type: String, unique: true, sparse: true },
    namn: { type: String, required: true, index: true },
    bransch: { type: String, required: true },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const AccountModel = mongoose.model<AccountDoc>("accounts", AccountSchema);
