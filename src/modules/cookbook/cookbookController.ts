import { Request, Response } from "express";
import mongoose from "mongoose";
import cookbookModel from "./Cookbook";
import { extractTitleFromPrompt, extractDescriptionFromPrompt } from "./cookbookUtils";
import logger from "../../utils/logger";

// Get a cookbook with all recipes
const getCookbookContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn("Cookbook not found when fetching content: %s", cookbookId);
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    logger.info("Fetched cookbook content for cookbookId: %s", cookbookId);
    res.status(200).json({ cookbook });
  } catch (error) {
    logger.error("Error fetching cookbook %s: %o", req.params.cookbookId, error);
    res.status(500).json({ message: "Failed to fetch cookbook", error: (error as Error).message });
  }
};

// Add a recipe to a cookbook
const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;
    const recipeData = req.body;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn("Cookbook not found when adding recipe: %s", cookbookId);
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Validate required fields
    if (!recipeData.title || !recipeData.description) {
      logger.warn("Attempted to add recipe with missing title/description to cookbook: %s", cookbookId);
      res.status(400).json({ message: "Title and description are required." });
      return;
    }

    // Extract title and description from the prompt output
    const title = extractTitleFromPrompt(recipeData.instructions);
    const description = extractDescriptionFromPrompt(recipeData.instructions);

    // Create a new recipe object
    const newRecipe = {
      _id: new mongoose.Types.ObjectId().toString(),
      title,
      description,
      mealType: recipeData.mealType || "N/A",
      cuisineType: recipeData.cuisineType || "N/A",
      difficulty: recipeData.difficulty || "N/A",
      prepTime: recipeData.prepTime || 0,
      cookingTime: recipeData.cookingTime || 0,      
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      imageURL: recipeData.imageURL || "",
      rating: recipeData.rating || 0.0,
    };

    // Add the recipe to the cookbook
    cookbook.recipes.push(newRecipe);

    // Save the updated cookbook
    await cookbook.save();

    logger.info("Recipe added to cookbook %s: %j", cookbookId, newRecipe);
    res.status(200).json({ message: "Recipe added to cookbook", cookbook });
  } catch (error) {
    logger.error("Error adding recipe to cookbook %s: %o", req.params.cookbookId, error);
    console.error("Error adding recipe to cookbook:", error);
    res.status(500).json({
      message: "Failed to add recipe to cookbook",
      error: (error as Error).message,
    });
  }
};

// Update a recipe in a cookbook
const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;
    const updatedRecipeData = req.body;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn("Cookbook not found when updating recipe: %s", cookbookId);
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Find the recipe by _id
    const recipeIndex = cookbook.recipes.findIndex((recipe) => recipe._id === recipeId);

    if (recipeIndex === -1) {
      logger.warn("Recipe not found in cookbook %s for update: %s", cookbookId, recipeId);
      res.status(404).json({ message: "Recipe not found in cookbook" });
      return;
    }

    // Update the recipe
    cookbook.recipes[recipeIndex] = { ...cookbook.recipes[recipeIndex], ...updatedRecipeData };

    // Save the updated cookbook
    await cookbook.save();

    logger.info("Recipe updated in cookbook %s: %j", cookbookId, cookbook.recipes[recipeIndex]);
    res.status(200).json({ message: "Recipe updated in cookbook", recipe: cookbook.recipes[recipeIndex] });
  } catch (error) {
    logger.error("Error updating recipe in cookbook %s: %o", req.params.cookbookId, error);
    res.status(500).json({ message: "Failed to update recipe in cookbook", error: (error as Error).message });
  }
};

// Remove a recipe from a cookbook
const removeRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn("Cookbook not found when removing recipe: %s", cookbookId);
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Filter out the recipe by _id
    const recipeToRemove = cookbook.recipes.filter((recipe) => recipe._id !== recipeId);
    cookbook.recipes = cookbook.recipes.filter((recipe) => recipe._id !== recipeId);
    await cookbook.save();

    logger.info("Recipe removed from cookbook %s: %j", cookbookId, recipeToRemove);
    res.status(200).json({ message: "Recipe removed from cookbook", cookbook });
  } catch (error) {
    logger.error("Error removing recipe from cookbook %s: %o", req.params.cookbookId, error);
    res.status(500).json({ message: "Failed to remove recipe from cookbook", error: (error as Error).message });
  }
};

export default {
  getCookbookContent,
  addRecipe,
  updateRecipe,
  removeRecipe,  
};