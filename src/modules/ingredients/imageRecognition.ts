import 'dotenv/config';
import vision from '@google-cloud/vision';
import { loadIngredientData } from '../../utils/ingredientData';
import { Ingredient } from './Ingredient';

const client = new vision.ImageAnnotatorClient();

// Recognize an image and return the detected ingredient and category
async function recognizePhoto(imagePath: string): Promise<Ingredient | null> {
  try {
    // Perform label detection
    const [result] = await client.labelDetection(imagePath);
    const labels = result.labelAnnotations;

    // Check if labels are defined and not empty
    if (labels && labels.length > 0) {
      // Log the detected labels
      labels.forEach(label => {
        console.log(`Label: ${label.description}, Score: ${label.score}`);
      });

      // Load the ingredient data
      const ingredientsData = await loadIngredientData();
      console.log(ingredientsData[0]);

      // Ensure ingredientsData is iterable
      if (!Array.isArray(ingredientsData)) {
        console.error('Error: ingredientsData is not an array.');
        return null;
      }

      // Find the highest score label that matches an ingredient
      let matchedIngredient: Ingredient | null = null;
      let highestScore = 0;

      for (const label of labels) {
        // Ensure label.description is defined
        if (!label.description) {
          continue;
        }

        const labelDescription = label.description.toLowerCase();
        for (const ingredient of ingredientsData) {
          if (
            ingredient.name.toLowerCase() === labelDescription &&
            label.score &&
            label.score > highestScore
          ) {
            matchedIngredient = {
              ...ingredient,
              imageURL: imagePath,
              quantity: 1,
            } as Ingredient;
            highestScore = label.score;
          }
        }
      }

      if (matchedIngredient) {
        console.log(`Ingredient: ${matchedIngredient.name}, Category: ${matchedIngredient.category}`);
        return matchedIngredient;
      } else {
        console.log('No matching ingredient found.');
        return null;
      }
    } else {
      console.log('No labels detected.');
      return null;
    }
  } catch (error) {
    console.error('Error during label detection:', error);
    return null;
  }
}

// Recognize an image and return the detected ingredient and category
async function recognizeReceipt(imagePath: string): Promise<Ingredient | null> {
  try {
    // Perform text detection
    const [result] = await client.textDetection(imagePath);
    const texts = result.textAnnotations;

    // Check if texts are defined and not empty
    if (texts && texts.length > 0) {
      // Log the detected texts
      texts.forEach(text => {
        console.log(`Text: ${text.description}`);
      });

      // Load the ingredient data
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