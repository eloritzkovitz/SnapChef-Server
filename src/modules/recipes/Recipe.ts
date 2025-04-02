import mongoose, { Schema, Document } from 'mongoose';
import { Ingredient } from '../ingredients/Ingredient';

export interface Recipe extends Document {
  recipeId: string;
  title: string;
  description: string;
  mealType: string;
  cuisine: string;
  difficulty: string;
  cookingTime: string;
  preparationTime: string;
  ingredients: Ingredient[];
  instructions: string;
  imageURLs: string[];
  rating: number;
}

const RecipeSchema: Schema = new Schema(
  {
    recipeId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    mealType: { type: String, required: true },
    cuisine: { type: String, required: true },
    difficulty: { type: String, required: true },
    cookingTime: { type: String, required: true },
    preparationTime: { type: String, required: true },
    instructions: { type: String, required: true },
    imageURLs: [{ type: String }],
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<Recipe>('Recipe', RecipeSchema);
export { RecipeSchema };
