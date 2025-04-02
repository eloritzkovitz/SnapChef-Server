import path from 'path';
import fs from 'fs';

interface Ingredient {
  id: string;
  name: string;
  category: string;
}

let ingredientsData: Ingredient[] | null = null;

export async function loadIngredientData(): Promise<Ingredient[]> {
  if (!ingredientsData) {
    const ingredientsPath = path.resolve(__dirname, '../data/ingredientData.json');
    console.log('Resolved path:', ingredientsPath);

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