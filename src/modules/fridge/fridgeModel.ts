import mongoose, { Schema, Document } from 'mongoose';

export interface FridgeItem extends Document {
  name: string;
  category: string;
  quantity: number;
  expiryDate?: Date;
  imageURL?: string;
}

const FridgeItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    expiryDate: { type: Date },
    imageURL: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<FridgeItem>('FridgeItem', FridgeItemSchema);
