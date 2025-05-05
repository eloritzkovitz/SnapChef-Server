import { Request, Response } from "express";
import mongoose from "mongoose";
import cookbookModel from "./Cookbook";

// Add a recipe to a cookbook
const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;
    const recipeData = req.body;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Validate required fields
    if (!recipeData.title || !recipeData.description) {
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
      cookingTime: recipeData.cookingTime || 0,
      prepTime: recipeData.prepTime || 0,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      imageURL: recipeData.imageURL || "",
      rating: recipeData.rating || 0.0,
    };

    // Add the recipe to the cookbook
    cookbook.recipes.push(newRecipe);

    // Save the updated cookbook
    await cookbook.save();

    res.status(200).json({ message: "Recipe added to cookbook", cookbook });
  } catch (error) {
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
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Find the recipe by _id
    const recipeIndex = cookbook.recipes.findIndex((recipe) => recipe._id === recipeId);

    if (recipeIndex === -1) {
      res.status(404).json({ message: "Recipe not found in cookbook" });
      return;
    }

    // Update the recipe
    cookbook.recipes[recipeIndex] = { ...cookbook.recipes[recipeIndex], ...updatedRecipeData };

    // Save the updated cookbook
    await cookbook.save();

    res.status(200).json({ message: "Recipe updated in cookbook", recipe: cookbook.recipes[recipeIndex] });
  } catch (error) {
    console.error("Error updating recipe in cookbook:", error);
    res.status(500).json({ message: "Failed to update recipe in cookbook", error: (error as Error).message });
  }
};

// Remove a recipe from a cookbook
const removeRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Filter out the recipe by _id
    cookbook.recipes = cookbook.recipes.filter((recipe) => recipe._id !== recipeId);

    // Save the updated cookbook
    await cookbook.save();

    res.status(200).json({ message: "Recipe removed from cookbook", cookbook });
  } catch (error) {
    console.error("Error removing recipe from cookbook:", error);
    res.status(500).json({ message: "Failed to remove recipe from cookbook", error: (error as Error).message });
  }
};

// Get a cookbook with all recipes
const getCookbookContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    res.status(200).json({ cookbook });
  } catch (error) {
    console.error("Error fetching cookbook:", error);
    res.status(500).json({ message: "Failed to fetch cookbook", error: (error as Error).message });
  }
};

// Helper function to extract the title from the prompt output
const extractTitleFromPrompt = (promptOutput: string[] | string): string => {
  if (!promptOutput) {
    return "Untitled Recipe";
  }

  // If the input is an array, join it into a single string
  const lines = Array.isArray(promptOutput)
    ? promptOutput.map((line) => line.trim())
    : promptOutput.split("\n").map((line) => line.trim());

  for (const line of lines) {
    if (line.startsWith("##") || line.startsWith("**Recipe:")) {
      // Remove Markdown formatting and return the title
      return line.replace(/##|(\*\*Recipe:)|\*\*/g, "").trim();
    }
  }

  // Fallback to the first non-empty line
  return lines.find((line) => line.length > 0) || "Untitled Recipe";
};

// Helper function to extract the description from the prompt output
const extractDescriptionFromPrompt = (promptOutput: string[] | string): string => {
  if (!promptOutput) {
    return "No description available.";
  }

  // If the input is an array, join it into a single string
  const lines = Array.isArray(promptOutput)
    ? promptOutput.map((line) => line.trim())
    : promptOutput.split("\n").map((line) => line.trim());

  let foundTitle = false;

  for (const line of lines) {
    if (line.startsWith("##") || line.startsWith("**Recipe:")) {
      foundTitle = true; // Skip the title
      continue;
    }

    if (foundTitle && line.length > 0 && !line.startsWith("**Ingredients:**") && !line.startsWith("**Instructions:**")) {
      // Remove Markdown formatting and return the description
      return line.replace(/\*\*/g, "").trim();
    }
  }

  return "No description available.";
};

export default {
  addRecipe,
  updateRecipe,
  removeRecipe,
  getCookbookContent,
};