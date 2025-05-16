import dotenv from 'dotenv';
import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

// Load environment variables and API key from .env file
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY must be defined in .env');
}

// Initialize Google Generative AI client with the API key
const genAI = new GoogleGenerativeAI(apiKey);

// Options interface for recipe generation
interface RecipeOptions {
  mealType?: string;
  cuisine?: string;
  difficulty?: string;
  prepTime?: number;
  cookingTime?: number;  
  preferences?: {
    allergies?: string[];
    dietaryPreferences?: Record<string, boolean>;
  };
}

// Generate a recipe based on the provided ingredients using Google Gemini API
const createRecipe = async (ingredients: string, options?: RecipeOptions): Promise<string> => {
  try {
    let prompt = `Create a recipe using the following ingredients: ${ingredients}.`;

    if (options) {
      if (options.mealType) prompt += ` Meal type: ${options.mealType}.`;
      if (options.cuisine) prompt += ` Cuisine: ${options.cuisine}.`;
      if (options.difficulty) prompt += ` Difficulty: ${options.difficulty}.`;
      if (options.prepTime) prompt += ` Prep time: ${options.prepTime} minutes.`;
      if (options.cookingTime) prompt += ` Cooking time: ${options.cookingTime} minutes.`;      

      // Add user preferences
      if (options.preferences) {
        if (options.preferences.allergies && options.preferences.allergies.length > 0) {
          prompt += ` Avoid these allergens: ${options.preferences.allergies.join(", ")}.`;
        }
        if (options.preferences.dietaryPreferences) {
          const activePrefs = Object.entries(options.preferences.dietaryPreferences)
            .filter(([_, v]) => v)
            .map(([k]) => k);
          if (activePrefs.length > 0) {
            prompt += ` Dietary preferences: ${activePrefs.join(", ")}.`;
          }
        }
      }
    }

    prompt += " Please provide instructions, cooking time, and serving suggestions.";    

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result: GenerateContentResult = await model.generateContent([prompt]);

    if (result && result.response && result.response.text) {
      let recipe: string = '';

      if (typeof result.response.text === 'function') {
        const textResult = result.response.text();
        if (typeof textResult === 'string') {
          recipe = textResult.trim();
        }
      } else if (typeof result.response.text === 'string') {
        recipe = (result.response.text as string).trim();
      }

      if (recipe) {
        return recipe;
      } else {
        throw new Error('Generated response was empty or not a valid string.');
      }
    } else {
      throw new Error('Failed to retrieve recipe from the generated response.');
    }
  } catch (error: any) {
    console.error('Error generating recipe:', error);

    let errorMessage = 'Failed to generate recipe. An unexpected error occurred.';

    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = `API Error: ${error.response.data.error.message}`;
    } else if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};

export { createRecipe };