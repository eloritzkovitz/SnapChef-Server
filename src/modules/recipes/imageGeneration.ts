import axios from "axios";
import dotenv from "dotenv";
import logger from "../../utils/logger";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!OPENAI_API_KEY) {
  throw new Error(
    "Missing OpenAI API key. Set OPENAI_API_KEY in your .env file."
  );
}
if (!UNSPLASH_ACCESS_KEY) {
  throw new Error(
    "Missing Unsplash API key. Set UNSPLASH_ACCESS_KEY in your .env file."
  );
}

/**
 * Generate an image for a recipe using OpenAI or Unsplash as a fallback.
 * @param recipe An object containing at least { title, description, [ingredients], [instructions] }
 */
export async function generateImageForRecipe(recipe: {
  title: string;
  description?: string;
  ingredients?: string[] | string;
  instructions?: string[] | string;
}): Promise<string | null> {
  // Remove markdown and "Recipe:" from the title for the prompt
  let safeTitle = recipe.title
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9\s\-()]/g, "")
    .trim();

  const words = safeTitle.split(" ");
  if (words.length > 10) {
    safeTitle = words.slice(0, 10).join(" ");
  }
  safeTitle = safeTitle.trim();

  let prompt = `A high-quality food photo of "${safeTitle}"`;
  if (recipe.description) {
    prompt += `. Description: ${recipe.description}`;
  }
  if (recipe.ingredients) {
    const ingredientsList = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(", ")
      : recipe.ingredients;
    prompt += `. Ingredients: ${ingredientsList}`;
  }
  prompt += ".";

  try {
    return await generateImageWithOpenAI(prompt);
  } catch (error) {
    logger.warn(
      "Falling back to Unsplash for image: %s",
      (error as Error).message
    );
    return await getImageForRecipe(safeTitle);
  }
}

// Generate an image using OpenAI API
export const generateImageWithOpenAI = async (
  prompt: string
): Promise<string> => {
  if (!prompt || prompt.trim().length < 10) {
    throw new Error(
      "Invalid image prompt. Prompt must be at least 10 characters."
    );
  }

  try {
    logger.info("Prompt to OpenAI: %s", prompt);

    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt,
        n: 1,
        size: "256x256",
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0].url;
  } catch (error: any) {
    logger.error("Error from OpenAI API:");
    if (error.response?.data?.error) {
      logger.error("Status: %s", error.response.status);
      logger.error("Message: %s", error.response.data.error.message);
      throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
    } else {
      logger.error("Unknown Error: %s", error.message);
      throw new Error(`Unexpected Error: ${error.message}`);
    }
  }
};

// Get an image from Unsplash
export const getImageForRecipe = async (
  query: string
): Promise<string | null> => {
  try {
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 1,
        orientation: "landscape",
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const imageUrl = response.data.results[0]?.urls?.regular;
    return imageUrl || null;
  } catch (error: any) {
    logger.error("Error fetching image from Unsplash: %s", error.message);
    return null;
  }
};
