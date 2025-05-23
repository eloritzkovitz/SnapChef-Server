import { Request, Response } from "express";
import { createRecipe } from "./recipeGeneration";
import { parseRecipeString } from "./recipeParser";
import { generateImageForRecipe } from "./imageGeneration";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";

// Generate a recipe based on user input
export const generateRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = getUserId(req);
  const { ingredients, ...options } = req.body;

  if (!userId) {
    logger.warn("Recipe generation attempted without authentication");
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  // Validate ingredients (string or array)
  const isIngredientsValid =
    (typeof ingredients === "string" && ingredients.trim() !== "") ||
    (Array.isArray(ingredients) && ingredients.length > 0);

  if (!isIngredientsValid) {
    logger.warn(
      "Recipe generation attempted without ingredients (user: %s)",
      userId
    );
    res.status(400).json({ error: "Ingredients are required." });
    return;
  }

  try {
    // Create the recipe (returns a string)
    const normalizedIngredients = Array.isArray(ingredients)
      ? ingredients.join(", ")
      : ingredients;
    const recipeStr = await createRecipe(normalizedIngredients, options);

    // Parse the recipe string into an object with at least a title
    const recipe = parseRecipeString(recipeStr);

    let imageUrl = "";
    try {
      imageUrl =
        (await generateImageForRecipe(recipe)) ||
        "https://via.placeholder.com/400x300?text=No+Image";
      logger.info(
        "Image generated for recipe: %s (user: %s)",
        recipe.title,
        userId
      );
    } catch (imageError: any) {
      logger.warn(
        "Failed to fetch image for recipe '%s' (user: %s): %o",
        recipe.title,
        userId,
        imageError
      );
      imageUrl = "https://via.placeholder.com/400x300?text=No+Image";
    }

    logger.info(
      "Recipe generated with ingredients: %s | Recipe: %j (user: %s)",
      ingredients,
      recipe,
      userId
    );

    res.json({ recipe, imageUrl });
  } catch (error) {
    logger.error(
      'Error generating recipe with ingredients "%s" (user: %s): %o',
      ingredients,
      userId,
      error
    );
    res.status(500).json({ error: (error as Error).message });
  }
};
