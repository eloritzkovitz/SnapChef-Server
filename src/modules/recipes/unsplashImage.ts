import axios from "axios";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  throw new Error("Missing Unsplash API key. Set UNSPLASH_ACCESS_KEY in your .env file.");
}

export const getImageForRecipe = async (query: string): Promise<string | null> => {
  try {
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 1,
        orientation: "landscape"
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const imageUrl = response.data.results[0]?.urls?.regular;
    return imageUrl || null;
  } catch (error: any) {
    console.error("Error fetching image from Unsplash:", error.message);
    return null;
  }
};
