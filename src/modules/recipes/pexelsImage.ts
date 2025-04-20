import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const pexelsKey = process.env.PEXELS_API_KEY;

if (!pexelsKey) {
  throw new Error("PEXELS_API_KEY must be defined in .env");
}

export const getImageFromPexels = async (query: string): Promise<string> => {
  try {
    const response = await axios.get("https://api.pexels.com/v1/search", {
      headers: {
        Authorization: pexelsKey,
      },
      params: {
        query,
        per_page: 1,
      },
    });

    const photo = response.data.photos?.[0];
    if (photo && photo.src && photo.src.medium) {
      return photo.src.medium;
    } else {
      throw new Error("No image found for query.");
    }
  } catch (error: any) {
    console.error("Error fetching image from Pexels:", error.message);
    throw new Error("Failed to fetch image from Pexels.");
  }
};
