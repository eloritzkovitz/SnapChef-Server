import path from 'path';
import fs from 'fs';

interface Ingredient {
  id: string;
  name: string;
  category: string;
}

let ingredientsData: Ingredient[] | null = null;

// Load ingredient data from JSON file
export async function loadIngredientData(): Promise<Ingredient[]> {
  if (!ingredientsData) {
    // Resolve the path to the data folder relative to the project root
    const ingredientsPath = path.resolve(process.cwd(), 'data/ingredientData.json');    

    try {
      const data = await fs.promises.readFile(ingredientsPath, 'utf-8');

      ingredientsData = JSON.parse(data) as Ingredient[];

      if (!Array.isArray(ingredientsData)) {
        console.error('Parsed data is not an array:', ingredientsData);
        throw new Error('Ingredient data is not an array');
      }
    } catch (error) {
      console.error('Error loading or parsing ingredient data:', error);
      throw error;
    }
  }

  return ingredientsData;
}