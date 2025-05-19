import path from 'path';
import fs from 'fs';
import { loadIngredientData } from './ingredientService';
import { Ingredient } from './Ingredient';

interface BarcodeData {
  id: string;
  barcode: string;
}

async function loadBarcodeData(): Promise<BarcodeData[]> {
  try {
    const barcodeDataPath = path.join(__dirname, '../../../data/barcodeData.json');
    const data = await fs.promises.readFile(barcodeDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading barcode data:', error);
    return [];
  }
}

export async function recognizeBarcode(barcode: string): Promise<Ingredient[]> {
  try {
    console.log('Recognizing barcode:', barcode);
    
    const [barcodeData, ingredientsData] = await Promise.all([
      loadBarcodeData(),
      loadIngredientData()
    ]);

    if (!Array.isArray(barcodeData) || !Array.isArray(ingredientsData)) {
      console.error('Error: Data is not in the expected format');
      return [];
    }

    const barcodeMatch = barcodeData.find(item => item.barcode === barcode);
    
    if (!barcodeMatch) {
      console.log('No matching barcode found:', barcode);
      return [];
    }

    const matchedIngredient = ingredientsData.find(
      ingredient => ingredient.id === barcodeMatch.id
    );

    if (matchedIngredient) {
      console.log('Found matching ingredient:', matchedIngredient.name);
      return [{
        ...matchedIngredient,
        quantity: 1,
      } as Ingredient];
    } else {
      console.log(`No ingredient found for barcode ${barcode}`);
      return [];
    }
  } catch (error) {
    console.error('Error during barcode recognition:', error);
    return [];
  }
}

export type { BarcodeData };