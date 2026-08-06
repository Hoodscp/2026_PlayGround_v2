import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMotionPreset extends Document {
  presetId: string;
  title: string;
  creatorNickname: string;
  stdDeviation: number;
  matrixValues: number[];
  likes: number;
  createdAt: Date;
}

const MotionPresetSchema: Schema<IMotionPreset> = new Schema(
  {
    presetId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    creatorNickname: { type: String, default: "Liquid Artist" },
    stdDeviation: { type: Number, required: true, default: 12 },
    matrixValues: { type: [Number], required: true },
    likes: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const MotionPresetModel: Model<IMotionPreset> =
  mongoose.models.MotionPreset || mongoose.model<IMotionPreset>("MotionPreset", MotionPresetSchema);
