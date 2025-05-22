import { Request, Response } from "express";
import { createRecipe } from "./recipeGeneration";
import { generateImageForRecipe } from "./imageGeneration";
import logger from "../../utils/logger";

export const generateRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ingredients, ...options } = req.body;

  if (!ingredients || ingredients.trim() === "") {
    logger.warn("Recipe generation attempted without ingredients");
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
        "Image generated for recipe with ingredients: %s",
        ingredients
      );
    } catch (imageError: any) {
      logger.warn(
        "Failed to fetch image for recipe with ingredients '%s': %o",
        ingredients,
        imageError
      );
      imageUrl = "https://via.placeholder.com/400x300?text=No+Image";
    }

    logger.info("Recipe generated with ingredients: %s | Recipe: %j", ingredients, recipe);

    res.json({ recipe, imageUrl });
  } catch (error) {
    logger.error('Error generating recipe with ingredients "%s": %o', ingredients, error);
    res.status(500).json({ error: (error as Error).message });
  }
};
