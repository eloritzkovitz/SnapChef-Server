import path from 'path';
import fs from 'fs';

interface Ingredient {
  id: string;
  name: string;
  category: string;
}

const ingredientsPath = path.resolve(process.cwd(), 'data/ingredientData.json');
let ingredientsCache: Ingredient[] | null = null;

// Load ingredient data from JSON file
export async function loadIngredientData(): Promise<Ingredient[]> {
  if (!ingredientsCache) {
    try {
      const data = await fs.promises.readFile(ingredientsPath, 'utf-8');
      ingredientsCache = JSON.parse(data) as Ingredient[];

      if (!Array.isArray(ingredientsCache)) {
        console.error('Parsed data is not an array:', ingredientsCache);
        throw new Error('Ingredient data is not an array');
      }
    } catch (error) {
      console.error('Error loading or parsing ingredient data:', error);
      throw error;
    }
  }

  return ingredientsCache;
}

// Watch the file for changes and reload the cache
fs.watch(ingredientsPath, async (eventType) => {
  if (eventType === 'change') {
    console.log('Detected change in ingredientData.json. Reloading...');
    try {
      const data = await fs.promises.readFile(ingredientsPath, 'utf-8');
      ingredientsCache = JSON.parse(data) as Ingredient[];

      if (!Array.isArray(ingredientsCache)) {
        console.error('Parsed data is not an array:', ingredientsCache);
        throw new Error('Ingredient data is not an array');
      }

      console.log('Ingredients reloaded:', ingredientsCache.length, 'items');
    } catch (error) {
      console.error('Error reloading ingredient data:', error);
    }
  }
});

// Export a function to get the cached data
export function getCachedIngredients(): Ingredient[] {
  if (!ingredientsCache) {
    throw new Error('Ingredients have not been loaded yet. Call loadIngredientData first.');
  }
  return ingredientsCache;
}