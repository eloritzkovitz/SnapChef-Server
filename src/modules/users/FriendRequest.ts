import mongoose, { Schema, Document } from "mongoose";

export interface IFriendRequest extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
}

const FriendRequestSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    to: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const FriendRequest = mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);
export default FriendRequest;