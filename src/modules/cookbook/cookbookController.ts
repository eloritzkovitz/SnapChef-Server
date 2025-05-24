import { Request, Response } from "express";
import mongoose from "mongoose";
import cookbookModel from "./Cookbook";
import { getField } from "./cookbookUtils";
import { parseRecipeString } from "../recipes/recipeParser";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";
import { generateImageForRecipe } from "../recipes/imageGeneration";

// Get a cookbook with all recipes
const getCookbookContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cookbookId } = req.params;
    const userId = getUserId(req);

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn(
        "Cookbook not found when fetching content: %s (user: %s)",
        cookbookId,
        userId
      );
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    logger.info(
      "Fetched cookbook content for cookbookId: %s (user: %s)",
      cookbookId,
      userId
    );
    res.status(200).json({ cookbook });
  } catch (error) {
    logger.error(
      "Error fetching cookbook %s (user: %s): %o",
      req.params.cookbookId,
      getUserId(req),
      error
    );
    res.status(500).json({
      message: "Failed to fetch cookbook",
      error: (error as Error).message,
    });
  }
};

// Add a recipe to a cookbook
const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId } = req.params;
    const recipeData = req.body;
    const userId = getUserId(req);

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn(
        "Cookbook not found when adding recipe: %s (user: %s)",
        cookbookId,
        userId
      );
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Get parsed values from the recipe string
    let parsed: { [key: string]: any } = {};
    if (recipeData.raw) {
      parsed = parseRecipeString(recipeData.raw);
    }

    // Use getField from cookbookUtils to prefer real values, fallback to parsed
    const title = getField(recipeData, "title", parsed.title);
    console.log(
      "Frontend title: %s | Parsed title: %s",
      recipeData.title,
      parsed.title
    );
    const description = getField(recipeData, "description", parsed.description);
    const prepTime = getField(recipeData, "prepTime", parsed.prepTime);
    const cookingTime = getField(recipeData, "cookingTime", parsed.cookingTime);

    // Validate required fields
    if (!title) {
      logger.warn(
        "Attempted to add recipe with missing title to cookbook: %s (user: %s)",
        cookbookId,
        userId
      );
      res.status(400).json({ message: "Title is required." });
      return;
    }

    // Create a new recipe object
    const newRecipe = {
      _id: new mongoose.Types.ObjectId().toString(),
      title,
      description,
      mealType: getField(recipeData, "mealType", parsed.mealType || "N/A"),
      cuisineType: getField(
        recipeData,
        "cuisineType",
        parsed.cuisineType || "N/A"
      ),
      difficulty: getField(
        recipeData,
        "difficulty",
        parsed.difficulty || "N/A"
      ),
      prepTime,
      cookingTime,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      imageURL: recipeData.imageURL || "",
      rating: recipeData.rating || 0.0,
      source: recipeData.source || "ai",
      raw: recipeData.raw || parsed.raw || "",
    };

    // Add the recipe to the cookbook
    cookbook.recipes.push(newRecipe);

    // Save the updated cookbook
    await cookbook.save();

    logger.info(
      "Recipe added to cookbook %s: %j (user: %s)",
      cookbookId,
      newRecipe,
      userId
    );
    res.status(200).json({ message: "Recipe added to cookbook", cookbook });
  } catch (error) {
    logger.error(
      "Error adding recipe to cookbook %s (user: %s): %o",
      req.params.cookbookId,
      getUserId(req),
      error
    );
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
    const userId = getUserId(req);

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn(
        "Cookbook not found when updating recipe: %s (user: %s)",
        cookbookId,
        userId
      );
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Find the recipe by _id
    const recipeIndex = cookbook.recipes.findIndex(
      (recipe) => recipe._id === recipeId
    );

    if (recipeIndex === -1) {
      logger.warn(
        "Recipe not found in cookbook %s for update: %s (user: %s)",
        cookbookId,
        recipeId,
        userId
      );
      res.status(404).json({ message: "Recipe not found in cookbook" });
      return;
    }

    // Update the recipe
    cookbook.recipes[recipeIndex] = {
      ...cookbook.recipes[recipeIndex],
      ...updatedRecipeData,
    };

    // Save the updated cookbook
    await cookbook.save();

    logger.info(
      "Recipe updated in cookbook %s: %j (user: %s)",
      cookbookId,
      cookbook.recipes[recipeIndex],
      userId
    );
    res.status(200).json({
      message: "Recipe updated in cookbook",
      recipe: cookbook.recipes[recipeIndex],
    });
  } catch (error) {
    logger.error(
      "Error updating recipe in cookbook %s (user: %s): %o",
      req.params.cookbookId,
      getUserId(req),
      error
    );
    res.status(500).json({
      message: "Failed to update recipe in cookbook",
      error: (error as Error).message,
    });
  }
};

// Regenerate the image for a recipe
const regenerateRecipeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;
    const userId = getUserId(req);

    const cookbook = await cookbookModel.findById(cookbookId);
    if (!cookbook) {
      logger.warn(
        "Cookbook not found when regenerating image: %s (user: %s)",
        cookbookId,
        userId
      );
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Find the recipe by _id (ensure string comparison)
    const recipe = cookbook.recipes.find((r) => r._id.toString() === recipeId);
    if (!recipe) {
      logger.warn(
        "Recipe not found in cookbook %s for image regeneration: %s (user: %s)",
        cookbookId,
        recipeId,
        userId
      );
      res.status(404).json({ message: "Recipe not found in cookbook" });
      return;
    }    

    // Generate the image
    const imageUrl = await generateImageForRecipe({
      title: recipe.title,
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map((ingredient: any) =>
            typeof ingredient === "string"
              ? ingredient
              : ingredient.name || ""
          )
        : [],
    });

    if (!imageUrl) {
      logger.error(
        "Failed to generate image for recipe %s in cookbook %s (user: %s)",
        recipeId,
        cookbookId,
        userId
      );
      res.status(500).json({ message: "Failed to generate image" });
      return;
    }

    // Update the recipe's imageURL and mark as modified
    recipe.imageURL = imageUrl;
    cookbook.markModified("recipes");
    await cookbook.save();

    logger.info(
      "Regenerated image for recipe %s in cookbook %s (user: %s)",
      recipeId,
      cookbookId,
      userId
    );
    res.status(200).json({ imageUrl });
  } catch (error) {
    logger.error(
      "Error regenerating image for recipe in cookbook %s (user: %s): %o",
      req.params.cookbookId,
      getUserId(req),
      error
    );
    res.status(500).json({
      message: "Failed to regenerate image for recipe in cookbook",
      error: (error as Error).message,
    });
  }
};

// Remove a recipe from a cookbook
const removeRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookbookId, recipeId } = req.params;
    const userId = getUserId(req);

    const cookbook = await cookbookModel.findById(cookbookId);

    if (!cookbook) {
      logger.warn(
        "Cookbook not found when removing recipe: %s (user: %s)",
        cookbookId,
        userId
      );
      res.status(404).json({ message: "Cookbook not found" });
      return;
    }

    // Find the recipe to remove for logging
    const recipeToRemove = cookbook.recipes.find(
      (recipe) => recipe._id === recipeId
    );

    // Filter out the recipe by _id
    cookbook.recipes = cookbook.recipes.filter(
      (recipe) => recipe._id !== recipeId
    );
    await cookbook.save();

    logger.info(
      "Recipe removed from cookbook %s: %j (user: %s)",
      cookbookId,
      recipeToRemove,
      userId
    );
    res.status(200).json({ message: "Recipe removed from cookbook", cookbook });
  } catch (error) {
    logger.error(
      "Error removing recipe from cookbook %s (user: %s): %o",
      req.params.cookbookId,
      getUserId(req),
      error
    );
    res.status(500).json({
      message: "Failed to remove recipe from cookbook",
      error: (error as Error).message,
    });
  }
};

export default {
  getCookbookContent,
  addRecipe,
  updateRecipe,
  regenerateRecipeImage,
  removeRecipe,
};
