import 'dotenv/config';
import vision from '@google-cloud/vision';
import { loadIngredientData } from './ingredientService';
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
async function recognizeReceipt(imagePath: string): Promise<Ingredient []> {
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

      // Ensure ingredientsData is iterable
      if (!Array.isArray(ingredientsData)) {
        console.error('Error: ingredientsData is not an array.');
        return [];
      }
      // Collect all matching ingredients
      const matchedIngredients: Ingredient[] = [];

      for (const text of texts) {
        const textDescription = text.description?.toLowerCase() ?? '';
        for (const ingredient of ingredientsData) {
          if (ingredient.name.toLowerCase() === textDescription) {
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
      console.log('No texts detected.');
      return [];
    }
  } catch (error) {
    console.error('Error during text detection:', error);
    return [];
  }
}

// Recognize a barcode and return the detected ingredient and category
async function recognizeBarcode(barcode: string): Promise<Ingredient[]> {
  try {
    console.log('Recognizing barcode:', barcode);
    if (barcode === '7290000060880') {
      // Load ingredient data
      const ingredientsData = await loadIngredientData();

      if (!Array.isArray(ingredientsData)) {
        console.error('Error: ingredientsData is not an array.');
        return [];
      }

      // Find the "Spaghetti" ingredient
      const spaghetti = ingredientsData.find(
        (ingredient) => ingredient.name.toLowerCase() === 'spaghetti'
      );

      if (spaghetti) {
        return [{
          ...spaghetti,
          quantity: 1,
        } as Ingredient];
      } else {
        console.log('Spaghetti ingredient not found in data.');
        return [];
      }
    } else {
      console.log('No matching ingredient found for barcode:', barcode);
      return [];
    }
  } catch (error) {
    console.error('Error during barcode recognition:', error);
    return [];
  }
}

export { recognizePhoto, recognizeReceipt, recognizeBarcode };