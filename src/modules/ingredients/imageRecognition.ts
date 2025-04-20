import 'dotenv/config';
import vision from '@google-cloud/vision';
import { loadIngredientData } from '../../utils/ingredientData';
import { Ingredient } from './Ingredient';

const client = new vision.ImageAnnotatorClient();

// Recognize an image and return the detected ingredients and their categories
async function recognizePhoto(imagePath: string): Promise<Ingredient[]> {
  try {
    // Perform object localization
    if (!client.objectLocalization) {
      throw new Error('Object localization is not available on the client.');
    }
    const [result] = await client.objectLocalization(imagePath);
    const objects = result.localizedObjectAnnotations;

    // Check if objects are defined and not empty
    if (objects && objects.length > 0) {
      // Log the detected objects
      objects.forEach(object => {
        console.log(`Object: ${object.name}, Score: ${object.score}`);
      });

      // Load the ingredient data
      const ingredientsData = await loadIngredientData();

      // Ensure ingredientsData is iterable
      if (!Array.isArray(ingredientsData)) {
        console.error('Error: ingredientsData is not an array.');
        return [];
      }

      // Collect all matching ingredients
      const matchedIngredients: Ingredient[] = [];

      for (const object of objects) {
        // Ensure object.name is defined
        if (!object.name) {
          continue;
        }

        const objectName = object.name.toLowerCase();
        for (const ingredient of ingredientsData) {
          if (ingredient.name.toLowerCase() === objectName) {
            matchedIngredients.push({
              ...ingredient,
              imageURL: imagePath,
              quantity: 1,
            } as Ingredient);
          }
        }
      }

      if (matchedIngredients.length > 0) {
        console.log('Matched Ingredients:', matchedIngredients.map(i => i.name).join(', '));
        return matchedIngredients;
      } else {
        console.log('No matching ingredients found.');
        return [];
      }
    } else {
      console.log('No objects detected.');
      return [];
    }
  } catch (error) {
    console.error('Error during object detection:', error);
    return [];
  }
}

// Recognize an image and return the detected ingredient and category
async function recognizeReceipt(imagePath: string): Promise<Ingredient | null> {
  try {
    // Perform text detection
    const [result] = await client.textDetection(imagePath);
    const texts = result.textAnnotations;

    // Check if the text is defined and not empty
    if (texts && texts.length > 0) {
      // Log the detected texts
      texts.forEach(text => {
        console.log(`Text: ${text.description}`);
      });

      // Load ingredient data
      const ingredientsData = await loadIngredientData();

      // Find the first text that matches an ingredient
      for (const text of texts) {
        const textDescription = text.description?.toLowerCase() ?? '';
        const matchedIngredient = ingredientsData.find(
          ingredient => ingredient.name.toLowerCase() === textDescription
        );

        if (matchedIngredient) {
          console.log(`Ingredient: ${matchedIngredient.name}, Category: ${matchedIngredient.category}`);
          return {
            ...matchedIngredient,
            imageURL: imagePath,
            quantity: 1,
          } as Ingredient;
        }
      }

      console.log('No matching ingredient found.');
      return null;
    } else {
      console.log('No texts detected.');
      return null;
    }
  } catch (error) {
    console.error('Error during text detection:', error);
    return null;
  }
}

// Recognize a barcode and return the detected ingredient and category
async function recognizeBarcode(imagePath: string): Promise<Ingredient | null> {
  try {
    // Perform barcode detection
    const [result] = await client.textDetection(imagePath);
    const barcodes = result.textAnnotations;

    // Check if barcodes are defined and not empty
    if (barcodes && barcodes.length > 0) {
      // Log the detected barcodes
      barcodes.forEach(barcode => {
        console.log(`Barcode: ${barcode.description}`);
      });

      // Load the ingredient data
      const ingredientsData = await loadIngredientData();

      // Find the first barcode that matches an ingredient
      for (const barcode of barcodes) {
        const barcodeDescription = barcode.description?.toLowerCase() ?? '';
        const matchedIngredient = ingredientsData.find(
          ingredient => ingredient.name.toLowerCase() === barcodeDescription
        );

        if (matchedIngredient) {
          console.log(`Ingredient: ${matchedIngredient.name}, Category: ${matchedIngredient.category}`);
          return {
            ...matchedIngredient,
            imageURL: imagePath,
            quantity: 1,
          } as Ingredient;
        }
      }

      console.log('No matching ingredient found.');
      return null;
    } else {
      console.log('No barcodes detected.');
      return null;
    }
  } catch (error) {
    console.error('Error during barcode detection:', error);
    return null;
  }
}

export { recognizePhoto, recognizeReceipt, recognizeBarcode };