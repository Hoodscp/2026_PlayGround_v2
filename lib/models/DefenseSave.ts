import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDefenseSave extends Document {
  guestId: string;
  saveData: Record<string, unknown>;
  updatedAt: Date;
}

const DefenseSaveSchema: Schema<IDefenseSave> = new Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    saveData: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

export const DefenseSaveModel: Model<IDefenseSave> =
  mongoose.models.DefenseSave || mongoose.model<IDefenseSave>("DefenseSave", DefenseSaveSchema);
