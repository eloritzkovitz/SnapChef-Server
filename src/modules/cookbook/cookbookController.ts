import { Request, Response } from "express";
import SavedRecipe from "./cookbookModel";

// Add saved recipe
export const saveRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, recipeId } = req.body;
    const saved = await SavedRecipe.create({ userId, recipeId });
    res.status(201).json(saved); // 👈 בלי return
  } catch (err) {
    res.status(400).json({ error: "Failed to save recipe" });
  }
};


// Remove saved recipe
export const removeSavedRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, recipeId } = req.body;
    const removed = await SavedRecipe.findOneAndDelete({ userId, recipeId });
    if (!removed) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ message: "Recipe removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove recipe" });
  }
};


// Share recipe with a friend
export const shareRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, recipeId, friendId } = req.body;
    const saved = await SavedRecipe.findOne({ userId, recipeId });
    if (!saved) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    saved.sharedWith?.push(friendId);
    await saved.save();

    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: "Failed to share recipe" });
  }
};


// Get all saved recipes (optionally filtered by category or prep time)
export const getSavedRecipes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, category, maxPrepTime } = req.query;
    const recipes = await SavedRecipe.find({ userId });

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: "Failed to get saved recipes" });
  }
};

