import mongoose, { Schema, Document, Types } from 'mongoose';
import { Recipe } from '../recipes/Recipe';

interface Cookbook extends Document {  
  ownerId: Schema.Types.ObjectId,
  recipes: Recipe[]; 
}

const CookbookSchema: Schema = new Schema(
  {    
    ownerId: { type: Schema.Types.ObjectId, ref: 'Users', required: true }, 
    recipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  },
  { timestamps: true }
);

const cookbookModel = mongoose.model<Cookbook>("Cookbooks", CookbookSchema);

export default cookbookModel;
