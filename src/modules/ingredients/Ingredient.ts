import mongoose, { Schema, Document } from 'mongoose';

export interface Ingredient extends Document {
  id: string;
  name: string;
  category: string;
  imageURL: string;
  quantity: number;
}

const IngredientSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    imageURL: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  { timestamps: true }
);

const ingredientModel = mongoose.model<Ingredient>("Ingredients", IngredientSchema);

export default ingredientModel;