import express from 'express';
import request from 'supertest';
import { generateRecipe } from '../modules/recipes/recipeController';
import * as recipeGen from '../modules/recipes/recipeGeneration';
//import * as pexels from '../modules/recipes/pexelsImage';

jest.mock('../modules/recipes/recipeGeneration');
jest.mock('../modules/recipes/pexelsImage');

const app = express();
app.use(express.json());
app.post('/generate-recipe', generateRecipe);

describe('generateRecipe', () => {
  const mockIngredients = 'tomato, onion, garlic';
  const mockRecipe = 'Mock recipe based on tomato, onion, garlic';
  const mockImageUrl = 'https://example.com/mock-image.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return recipe and image when both succeed', async () => {
    (recipeGen.createRecipe as jest.Mock).mockResolvedValue(mockRecipe);
    //(pexels.getImageFromPexels as jest.Mock).mockResolvedValue(mockImageUrl);

    const res = await request(app).post('/generate-recipe').send({ ingredients: mockIngredients });

    expect(res.status).toBe(200);
    expect(res.body.recipe).toBe(mockRecipe);
    expect(res.body.imageUrl).toBe(mockImageUrl);
    expect(recipeGen.createRecipe).toHaveBeenCalledWith(mockIngredients);
    //expect(pexels.getImageFromPexels).toHaveBeenCalledWith(mockIngredients);
  });

  it('should return recipe with placeholder image if image fetch fails', async () => {
    (recipeGen.createRecipe as jest.Mock).mockResolvedValue(mockRecipe);
    //(pexels.getImageFromPexels as jest.Mock).mockRejectedValue(new Error('Pexels error'));

    const res = await request(app).post('/generate-recipe').send({ ingredients: mockIngredients });

    expect(res.status).toBe(200);
    expect(res.body.recipe).toBe(mockRecipe);
    expect(res.body.imageUrl).toContain('via.placeholder.com');
  });

  it('should return 400 if ingredients are missing', async () => {
    const res = await request(app).post('/generate-recipe').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ingredients are required.');
  });

  it('should return 500 if recipe generation fails', async () => {
    (recipeGen.createRecipe as jest.Mock).mockRejectedValue(new Error('Generation failed'));

    const res = await request(app).post('/generate-recipe').send({ ingredients: mockIngredients });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Generation failed');
  });
});
