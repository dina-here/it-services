import mongoose from "mongoose";

export interface EventDoc extends mongoose.Document {
  typ: string;
  entitet: string;
  entitetId: string;
  actorUserId?: string;
  payload: Record<string, unknown>;
  skapad: Date;
}

const EventSchema = new mongoose.Schema<EventDoc>(
  {
    typ: { type: String, required: true, index: true },
    entitet: { type: String, required: true, index: true },
    entitetId: { type: String, required: true, index: true },
    actorUserId: { type: String, required: false, index: true },
    payload: { type: Object, required: true, default: {} },
  },
  { timestamps: { createdAt: "skapad", updatedAt: false } }
);

export const EventModel = mongoose.model<EventDoc>("events", EventSchema);
