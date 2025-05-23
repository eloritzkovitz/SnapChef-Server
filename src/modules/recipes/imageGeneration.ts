import axios from "axios";
import dotenv from "dotenv";
import logger from "../../utils/logger";
import { GoogleAuth } from "google-auth-library";
import { saveBase64Image } from "../../utils/fileService";

dotenv.config();

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_PROJECT_REGION = process.env.GOOGLE_REGION || "us-central1";
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_ENDPOINT_ID = process.env.GOOGLE_ENDPOINT_ID;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!GOOGLE_PROJECT_ID) {
  throw new Error(
    "Missing Google Cloud project ID. Set GOOGLE_PROJECT_ID in your .env file."
  );
}
if (!GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error(
    "Missing Google Cloud credentials. Set GOOGLE_APPLICATION_CREDENTIALS in your .env file."
  );
}
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

// Helper to get a Google Cloud access token using the service account JSON
async function getGoogleAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    keyFile: GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse || !tokenResponse.token) {
    throw new Error("Failed to obtain Google Cloud access token");
  }
  return tokenResponse.token;
}

/**
 * Generate an image for a recipe using Google Cloud Stable Diffusion, OpenAI, or Unsplash as fallback.
 */
export async function generateImageForRecipe(recipe: {
  title: string;
  description?: string;
  ingredients?: string[] | string;
  instructions?: string[] | string;
}): Promise<string | null> {
  // Clean the title: remove quotes and trim
  let safeTitle = recipe.title
    .replace(/["']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9\s\-()]/g, "")
    .trim();

  const words = safeTitle.split(" ");
  if (words.length > 10) {
    safeTitle = words.slice(0, 10).join(" ");
  }
  safeTitle = safeTitle.trim();

  // Prompt for image generation
  let prompt = `A high-quality food photo of ${safeTitle}`;  
  if (recipe.ingredients) {
    const ingredientsList = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(", ")
      : recipe.ingredients;
    prompt += `. Ingredients: ${ingredientsList}`;
  }
  prompt += ".";

  // 1. Try Google Cloud Stable Diffusion (Vertex AI)
  try {
    const base64Image = await generateImageWithGoogleCloudStableDiffusion(prompt);
    // Save the image and return the URL
    const filename = `${safeTitle.replace(/\s+/g, "_")}_${Date.now()}.jpg`;
    const imageUrl = saveBase64Image(base64Image, filename);
    return imageUrl;
  } catch (error: any) {
    logger.warn(
      "Falling back to OpenAI for image: %s",
      JSON.stringify(error.response?.data || error.message)
    );
  }

  // 2. Try OpenAI
  // try {
  //   return await generateImageWithOpenAI(prompt);
  // } catch (error) {
  //   logger.warn(
  //     "Falling back to Unsplash for image: %s",
  //     (error as Error).message
  //   );
  // }

  // 3. Try Unsplash
  try {
    return await getImageForRecipe(safeTitle);
  } catch (error) {
    logger.error("Unsplash failed: %s", (error as Error).message);
    return null;
  }
}

// Google Cloud Stable Diffusion (Vertex AI) - Custom Endpoint
export const generateImageWithGoogleCloudStableDiffusion = async (
  prompt: string
): Promise<string> => {
  logger.info("Prompt to Google Cloud Stable Diffusion: %s", prompt);

  // Get a fresh access token for each request
  const accessToken = await getGoogleAccessToken();

  // Replace with your actual endpointId and projectNumber
  const endpointId = GOOGLE_ENDPOINT_ID;
  const projectNumber = GOOGLE_PROJECT_NUMBER;
  const region = GOOGLE_PROJECT_REGION;

  const endpoint = `https://${endpointId}.${region}-${projectNumber}.prediction.vertexai.goog/v1/projects/${GOOGLE_PROJECT_ID}/locations/${region}/endpoints/${endpointId}:predict`;

  const response = await axios.post(
    endpoint,
    {
      instances: [
        {
          prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        guidanceScale: 7.5,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );  

  // Extract the image from the correct field
  const prediction = response.data?.predictions?.[0];

  if (!prediction) {
    throw new Error("No image returned by Google Cloud Stable Diffusion");
  }
  return `data:image/jpeg;base64,${prediction}`;
};

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