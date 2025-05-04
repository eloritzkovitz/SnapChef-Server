import { Request, Response } from "express";
import cookbookModel from "./Cookbook";
import { logActivity } from "../../utils/logService";

const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;
    const recipeData = req.body;

    const cookbook = await cookbookModel.findById(cookbookId);
    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    cookbook.recipes.push(recipeData);
    await cookbook.save();

    await logActivity(
      String(cookbook.ownerId),
      "add",
      "recipe",
      String(cookbook._id),
      { recipe: recipeData }
    );

    res.status(200).json({ message: "Recipe added to cookbook", cookbook });
  } catch (error) {
    console.error("Error adding recipe to cookbook:", error);
    res.status(500).json({ message: "Failed to add recipe to cookbook", error: (error as Error).message });
  }
};

const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;
    const updatedRecipeData = req.body;

    const cookbook = await cookbookModel.findById(cookbookId);
    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    const recipeIndex = cookbook.recipes.findIndex((recipe) => recipe._id === recipeId);
    if (recipeIndex === -1) {
      res.status(404).json({ message: "Recipe not found in cookbook" });
      return;
    }

    const oldRecipe = cookbook.recipes[recipeIndex];
    cookbook.recipes[recipeIndex] = { ...oldRecipe, ...updatedRecipeData };
    await cookbook.save();

    await logActivity(
      String(cookbook.ownerId),
      "update",
      "recipe",
      String(cookbook._id),
      {
        recipeId,
        oldRecipe,
        updatedRecipe: cookbook.recipes[recipeIndex]
      }
    );

    res.status(200).json({ message: "Recipe updated in cookbook", recipe: cookbook.recipes[recipeIndex] });
  } catch (error) {
    console.error("Error updating recipe in cookbook:", error);
    res.status(500).json({ message: "Failed to update recipe in cookbook", error: (error as Error).message });
  }
};

const removeRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;

    const cookbook = await cookbookModel.findById(cookbookId);
    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    const recipeToDelete = cookbook.recipes.find((r) => r._id === recipeId);
    if (!recipeToDelete) {
      res.status(404).json({ message: "Recipe not found in cookbook" });
      return;
    }

    cookbook.recipes = cookbook.recipes.filter((recipe) => recipe._id !== recipeId);
    await cookbook.save();

    await logActivity(
      String(cookbook.ownerId),
      "delete",
      "recipe",
      String(cookbook._id),
      { deletedRecipe: recipeToDelete }
    );

    res.status(200).json({ message: "Recipe removed from cookbook", cookbook });
  } catch (error) {
    console.error("Error removing recipe from cookbook:", error);
    res.status(500).json({ message: "Failed to remove recipe from cookbook", error: (error as Error).message });
  }
};

const getCookbookContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;

    const cookbook = await cookbookModel.findById(cookbookId);
    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    await logActivity(
      String(cookbook.ownerId),
      "read",
      "cookbook",
      String(cookbook._id),
      {}
    );

    res.status(200).json({ cookbook });
  } catch (error) {
    console.error("Error fetching cookbook:", error);
    res.status(500).json({ message: "Failed to fetch cookbook", error: (error as Error).message });
  }
};

export default {
  addRecipe,
  updateRecipe,
  removeRecipe,
  getCookbookContent,
};
