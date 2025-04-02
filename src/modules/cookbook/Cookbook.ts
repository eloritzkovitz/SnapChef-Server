import mongoose, { Schema, Document, Types } from 'mongoose';

export interface SavedRecipe extends Document {
  cookbookId: string;
  userId: string;
  recipes: Types.ObjectId[];
  sharedWith?: string[];    
}

const SavedRecipeSchema: Schema = new Schema(
  {
    cookbookId: { type: String, required: true },
    userId: { type: String, required: true },
    recipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe', required: true }],
    sharedWith: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<SavedRecipe>('SavedRecipe', SavedRecipeSchema);
