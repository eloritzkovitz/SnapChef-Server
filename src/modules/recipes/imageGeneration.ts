import { getImageForRecipe } from "./unsplashImage";

export async function generateImageForRecipe(recipeName: string): Promise<string | null> {
  return await getImageForRecipe(recipeName);
}