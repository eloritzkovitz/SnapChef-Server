import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY in your .env file.");
}

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    if (!prompt || prompt.trim().length < 10) {
      throw new Error("Invalid image prompt. Prompt must be at least 10 characters.");
    }

    console.log("🟡 Prompt to OpenAI:", prompt);

    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt,
        n: 1,
        size: "256x256",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0].url;
  } catch (error: any) {
    console.error("Error from OpenAI API:");
    if (error.response?.data?.error) {
      console.error("Status:", error.response.status);
      console.error("Message:", error.response.data.error.message);
      throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
    } else {
      console.error("Unknown Error:", error.message);
      throw new Error(`Unexpected Error: ${error.message}`);
    }
  }
};
