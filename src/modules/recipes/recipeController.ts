import { Request, Response } from "express";
import { createRecipe } from "./recipeGeneration";
import { generateImageForRecipe } from "./imageGeneration";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";

// Generate a recipe based on user input
export const generateRecipe = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { ingredients, ...options } = req.body;

  if (!userId) {
    logger.warn("Recipe generation attempted without authentication");
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  if (!ingredients || ingredients.trim() === "") {
    logger.warn("Recipe generation attempted without ingredients (user: %s)", userId);
    res.status(400).json({ error: "Ingredients are required." });
    return;
  }

  try {
    const recipe = await createRecipe(ingredients, options);

    let imageUrl = "";
    try {
      imageUrl =
        (await generateImageForRecipe(ingredients)) ||
        "https://via.placeholder.com/400x300?text=No+Image";
      logger.info(
        "Image generated for recipe with ingredients: %s (user: %s)",
        ingredients,
        userId
      );
    } catch (imageError: any) {
      logger.warn(
        "Failed to fetch image for recipe with ingredients '%s' (user: %s): %o",
        ingredients,
        userId,
        imageError
      );
      imageUrl = "https://via.placeholder.com/400x300?text=No+Image";
    }

    logger.info("Recipe generated with ingredients: %s | Recipe: %j (user: %s)", ingredients, recipe, userId);

    res.json({ recipe, imageUrl });
  } catch (error) {
    logger.error('Error generating recipe with ingredients "%s" (user: %s): %o', ingredients, userId, error);
    res.status(500).json({ error: (error as Error).message });
  }
};