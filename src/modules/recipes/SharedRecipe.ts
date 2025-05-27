import mongoose from "mongoose";

const SharedRecipeSchema = new mongoose.Schema({
  recipe: { type: Object, required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  sharedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "viewed", "imported"], default: "pending" },
});

const SharedRecipe = mongoose.model("SharedRecipe", SharedRecipeSchema);

export default SharedRecipe;