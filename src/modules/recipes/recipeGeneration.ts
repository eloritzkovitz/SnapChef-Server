import dotenv from 'dotenv';
import { VertexAI } from '@google-cloud/vertexai';

dotenv.config();

const projectId = process.env.PROJECT_ID;
const location = process.env.LOCATION;
const modelName = 'gemini-pro';

if (!projectId || !location) {
  throw new Error('PROJECT_ID and LOCATION must be defined in .env');
}

const vertexAI = new VertexAI({ project: projectId, location: location });
const model = vertexAI.getGenerativeModel({ model: modelName });

const createRecipe = async (ingredients: string): Promise<string> => {
  try {
    const request = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `Create a recipe using the following ingredients: ${ingredients}` }],
        },
      ],
    };

    const result = await model.generateContent(request);
    const response = await result.response;

    const recipe = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (recipe) {
      return recipe.trim();
    } else {
      throw new Error('No recipe generated.');
    }
  } catch (error: any) {
    console.error('Error generating recipe:', error);

    let errorMessage = 'Failed to generate recipe.';
    if (
      error.response &&
      error.response.data &&
      error.response.data.error &&
      error.response.data.error.message
    ) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

export { createRecipe };
