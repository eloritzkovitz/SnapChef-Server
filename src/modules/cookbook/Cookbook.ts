import mongoose, { Schema, Document } from 'mongoose';
import type { Ingredient } from '../ingredients/Ingredient';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  mealType: string;
  cuisineType: string;
  difficulty: string;
  prepTime: number;
  cookingTime: number;    
  ingredients: Ingredient[];
  instructions: string[];
  imageURL?: string;
  rating: number | null;
  source: 'ai' | 'user' | 'manual';
}

interface Cookbook extends Document {  
  ownerId: Schema.Types.ObjectId,
  recipes: Recipe[]; 
}

const CookbookSchema: Schema = new Schema(
  {    
    ownerId: { type: Schema.Types.ObjectId, ref: 'Users', required: true }, 
    recipes: { type: [Object], default: [] },
  },
  { timestamps: true }
);

const cookbookModel = mongoose.model<Cookbook>("Cookbooks", CookbookSchema);

export default cookbookModel;
