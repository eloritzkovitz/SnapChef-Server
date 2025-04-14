import mongoose, { Schema, Document } from 'mongoose';
import type { Ingredient } from '../ingredients/Ingredient';

interface Recipe {
  id: string;
  title: string;
  description: string;
  mealType: string;
  cuisineType: string;
  difficulty: string;
  cookingTime: number;
  prepTime: number;  
  ingredients: Ingredient[];
  instructions: string[];
  imageURL?: string;
  rating: number;
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
