import { Request, Response } from 'express';
import { createRecipe } from './recipeGeneration';
import { generateImageForRecipe } from "./imageGeneration";

export const generateRecipe = async (req: Request, res: Response): Promise<void> => {
  const { ingredients, ...options } = req.body;

  if (!ingredients || ingredients.trim() === "") {
    res.status(400).json({ error: 'Ingredients are required.' });
    return;
  }

  try {
    const recipe = await createRecipe(ingredients, options);

    let imageUrl = '';
try {
  imageUrl = (await generateImageForRecipe(ingredients)) || "https://via.placeholder.com/400x300?text=No+Image";
} catch (imageError: any) {
  console.warn("Failed to fetch image from Unsplash. Returning recipe without image.");
  imageUrl = "https://via.placeholder.com/400x300?text=No+Image"; 
}


    res.json({ recipe, imageUrl });
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
