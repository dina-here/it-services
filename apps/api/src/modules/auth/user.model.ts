import mongoose from "mongoose";

export type UserRoll = "SUPERADMIN" | "ADMIN" | "CHEF" | "MEDARBETARE";

export interface UserDoc extends mongoose.Document {
  epost: string;
  losenHash: string;
  roll: UserRoll;
  employeeId?: string; // Koppling till HR-anställd (valfritt men praktiskt)
  skapad: Date;
}

const UserSchema = new mongoose.Schema<UserDoc>(
  {
    epost: { type: String, required: true, unique: true, lowercase: true, index: true },
    losenHash: { type: String, required: true },
    roll: { type: String, required: true, enum: ["SUPERADMIN", "ADMIN", "CHEF", "MEDARBETARE"] },
    employeeId: { type: String, required: false },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const UserModel = mongoose.model<UserDoc>("users", UserSchema);
