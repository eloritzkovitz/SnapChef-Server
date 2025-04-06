import { Request, Response } from 'express';
import fs from 'fs/promises';
import { recognizePhoto, recognizeReceipt, recognizeBarcode } from './imageRecognition';
import  ingredientModel from './Ingredient';
import { loadIngredientData } from '../../utils/ingredientData';

// Handle ingredient recognition
export const recognize = async (req: Request, res: Response, type: string): Promise<void> => {
  console.log(`Received POST request at /recognize/${type}`);
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    let result;
    try {
      switch (type) {
        case 'photo':
          result = await recognizePhoto(file.path);
          break;
        case 'receipt':
          result = await recognizeReceipt(file.path);
          break;
        case 'barcode':
          result = await recognizeBarcode(file.path);
          break;
        default:
          res.status(400).json({ error: 'Invalid recognition type.' });
          return;
      }

      res.json(result);
    } finally {
      // Delete the file after processing
      await fs.unlink(file.path).catch((err) => {
        console.error(`Error deleting file ${file.path}:`, err);
      });
    }
  } catch (error) {
    console.error(`Error recognizing ${type}:`, error);
    res.status(500).json({ error: 'Failed to recognize image.' });
  }
};

// Get all ingredients
const getAllIngredients = async (req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await loadIngredientData();
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients.' });
  }
}

// Find ingredient by ID
const getIngredientById = async(req: Request, res: Response): Promise<void> => {
  const _id = req.params.id;
  if (!_id) {
    res.status(400).json({ error: "ID parameter is required" });
    return;
  }

  try {
      const ingredient = await ingredientModel.findOne({id: _id}).select("id name category imageURL");
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ingredients" });
  }
}

// Find ingredients by query (name or category)
const getIngredientsByQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters
    const { name, category } = req.query;

    // Validate that at least one query parameter is provided
    if (!name && !category) {
      res.status(400).json({ error: "At least one query parameter ('name' or 'category') is required." });
      return;
    }

    // Build the filter object dynamically
    const filter: any = {};
    if (name) {
      filter.name = { $regex: name, $options: "i" }; // Case-insensitive regex for name
    }
    if (category) {
      filter.category = { $regex: category, $options: "i" }; // Case-insensitive regex for category
    }

    // Query the database
    const ingredients = await ingredientModel.find(filter).select("id name category imageURL");

    // Handle no results found
    if (ingredients.length === 0) {
      res.status(404).json({ error: "No ingredients found matching the query." });
      return;
    }

    // Return the results
    res.status(200).json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients by query:", error);
    res.status(500).json({ error: "Error fetching ingredients." });
  }
};

export default {
  recognize,
  getAllIngredients,
  getIngredientById,
  getIngredientsByQuery,  
};