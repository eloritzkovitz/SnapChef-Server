import mongoose, { Schema, Document } from 'mongoose';

export interface SavedRecipe extends Document {
  userId: string;
  recipeId: string;
  sharedWith?: string[]; // userIds friends that you sherd with
}

const SavedRecipeSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    recipeId: { type: String, required: true },
    sharedWith: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model<SavedRecipe>('SavedRecipe', SavedRecipeSchema);
