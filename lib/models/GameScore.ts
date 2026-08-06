import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGameScore extends Document {
  guestId: string;
  nickname: string;
  gameId: "defense" | "tetris" | "blob" | "maze";
  difficulty?: string;
  score: number;
  clearTime?: number; // seconds
  wave?: number;
  extraStats?: Record<string, unknown>;
  createdAt: Date;
}

const GameScoreSchema: Schema<IGameScore> = new Schema(
  {
    guestId: { type: String, required: true, index: true },
    nickname: { type: String, required: true, default: "Anonymous Blob" },
    gameId: {
      type: String,
      required: true,
      enum: ["defense", "tetris", "blob", "maze"],
      index: true,
    },
    difficulty: { type: String, default: "NORMAL" },
    score: { type: Number, required: true, index: -1 },
    clearTime: { type: Number },
    wave: { type: Number },
    extraStats: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound Index for fast leaderboard retrieval
GameScoreSchema.index({ gameId: 1, difficulty: 1, score: -1 });

export const GameScoreModel: Model<IGameScore> =
  mongoose.models.GameScore || mongoose.model<IGameScore>("GameScore", GameScoreSchema);
