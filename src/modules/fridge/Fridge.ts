import mongoose, { Schema, Document, Types } from 'mongoose';

interface Fridge extends Document {
  fridgeId: string;
  userId: string;
  ingredients: Types.ObjectId[]; 
}

const FridgeSchema: Schema = new Schema(
  {
    fridgeId: { type: String, required: true },
    userId: { type: String, required: true }, 
    ingredients: [{ type: Schema.Types.ObjectId, ref: 'Ingredient' }],
  },
  { timestamps: true }
);

export default mongoose.model<Fridge>('Fridge', FridgeSchema);
