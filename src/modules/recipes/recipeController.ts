import { Request, Response } from 'express';
import { createRecipe } from './recipeGeneration';
import { getImageFromPexels } from './pexelsImage';

export const generateRecipe = async (req: Request, res: Response): Promise<void> => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.trim() === "") {
    res.status(400).json({ error: 'Ingredients are required.' });
    return;
  }

  try {
    const recipe = await createRecipe(ingredients);

    let imageUrl = '';
    try {
      imageUrl = await getImageFromPexels(ingredients);
    } catch (imageError: any) {
      console.warn("Failed to fetch image from Pexels. Returning recipe without image.");
      imageUrl = "https://via.placeholder.com/400x300?text=No+Image"; 
    }

    res.json({ recipe, imageUrl });
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
