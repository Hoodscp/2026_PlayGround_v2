import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  guestId: string;
  nickname: string;
  avatarSeed?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, required: true, default: "Liquid Blob" },
    avatarSeed: { type: String, default: "blob-1" },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
