import express from 'express';
import request from 'supertest';
import ingredientController from '../modules/ingredients/ingredientController';
import ingredientModel from '../modules/ingredients/Ingredient';
import { loadIngredientData } from '../utils/ingredientData';

jest.mock('../modules/ingredients/Ingredient');
jest.mock('../modules/ingredients/imageRecognition');
jest.mock('../utils/ingredientData', () => ({
  __esModule: true,
  loadIngredientData: jest.fn(),
}));

const app = express();
app.use(express.json());

app.get('/ingredients', ingredientController.getAllIngredients);
app.get('/ingredients/:id', ingredientController.getIngredientById);
app.get('/search', ingredientController.getIngredientsByQuery);

describe('ingredientController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllIngredients', () => {
    it('should return all ingredients', async () => {
      const mockIngredients = [
        { id: '1', name: 'Tomato', category: 'Veg' },
        { id: '2', name: 'Carrot', category: 'Veg' },
      ];
      (loadIngredientData as jest.Mock).mockResolvedValue(mockIngredients);

      const res = await request(app).get('/ingredients');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockIngredients);
    });

    it('should handle errors', async () => {
      (loadIngredientData as jest.Mock).mockRejectedValue(new Error());

      const res = await request(app).get('/ingredients');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch ingredients.');
    });
  });

  describe('getIngredientById', () => {
    const mockItem = { id: '1', name: 'Tomato', category: 'Veg', imageURL: 'url' };

    it('should return an ingredient', async () => {
      (ingredientModel.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockItem),
      });

      const res = await request(app).get('/ingredients/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockItem);
    });

    it('should handle fetch error', async () => {
      (ingredientModel.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockRejectedValueOnce(new Error()),
      });

      const res = await request(app).get('/ingredients/1');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error fetching ingredients');
    });
  });

  describe('getIngredientsByQuery', () => {
    const mockData = [
      { id: '1', name: 'Carrot', category: 'Veg', imageURL: 'url1' },
      { id: '2', name: 'Tomato', category: 'Veg', imageURL: 'url2' },
    ];

    it('should return filtered ingredients by name', async () => {
      (ingredientModel.find as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockData),
      });

      const res = await request(app).get('/search?name=carrot');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
    });

    it('should return 404 if no ingredients found', async () => {
      (ingredientModel.find as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce([]),
      });

      const res = await request(app).get('/search?name=x');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No ingredients found matching the query.');
    });

    it('should return 400 if no query provided', async () => {
      const res = await request(app).get('/search');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("At least one query parameter ('name' or 'category') is required.");
    });

    it('should handle error', async () => {
      (ingredientModel.find as jest.Mock).mockImplementationOnce(() => {
        throw new Error();
      });

      const res = await request(app).get('/search?name=tomato');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error fetching ingredients.');
    });
  });
});
