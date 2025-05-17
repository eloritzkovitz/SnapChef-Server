import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { recognizePhoto, recognizeReceipt, recognizeBarcode } from './imageRecognition';
import  ingredientModel from './Ingredient';
import { loadIngredientData } from './ingredientService';

const ingredientsPath = path.resolve(process.cwd(), 'data/ingredientData.json');

// Handle ingredient recognition
export const recognize = async (req: Request, res: Response, type: string): Promise<void> => {
  console.log(`Received POST request at /recognize/${type}`);
  try {
    let result;

    // For barcode: expect a barcode string in the request body
    if (type === 'barcode') {      
      const barcode = req.body.barcode;
      if (!barcode) {
        res.status(400).json({ error: 'No barcode provided.' });
        return;
      }
      result = await recognizeBarcode(barcode);
      res.json(result);
      return;
    }

    // For photo/receipt: expect image file
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    try {
      switch (type) {
        case 'photo':
          result = await recognizePhoto(file.path);
          break;
        case 'receipt':
          result = await recognizeReceipt(file.path);
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

// Add a new ingredient to the database
const addIngredient = async (req: Request, res: Response): Promise<void> => {
  const { name, category } = req.body;

  if (!name || !category) {
    res.status(400).json({ message: "Name and category are required." });
    return;
  }

  try {
    // Read the existing data
    const data = await fs.readFile(ingredientsPath, "utf-8");
    const ingredients = JSON.parse(data);

    // Find the highest existing ID and increment it
    const lastId = ingredients.reduce((maxId: number, ingredient: any) => {
      const currentId = parseInt(ingredient.id, 10);
      return currentId > maxId ? currentId : maxId;
    }, 0);

    const newId = (lastId + 1).toString();

    // Check if the name already exists
    if (ingredients.some((ingredient: any) => ingredient.name === name)) {
      res.status(400).json({ message: "Ingredient with this name already exists." });
      return;
    }

    // Create the new ingredient
    const newIngredient = {
      id: newId,
      name,
      category,
    };

    // Add the new ingredient
    ingredients.push(newIngredient);

    // Write the updated data back to the file
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    // Return the new ingredient directly
    res.status(201).json(newIngredient);
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ message: "Error adding ingredient." });
  }
};

// Edit an existing ingredient in the database
const editIngredient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, category } = req.body;

  if (!id || (!name && !category)) {
    res.status(400).json({ message: "ID and at least one field (name or category) are required." });
    return;
  }

  try {
    // Read the existing data
    const data = await fs.readFile(ingredientsPath, "utf-8");
    const ingredients = JSON.parse(data);

    // Find the ingredient by ID
    const ingredientIndex = ingredients.findIndex((ingredient: any) => ingredient.id === id);
    if (ingredientIndex === -1) {
      res.status(404).json({ message: "Ingredient not found." });
      return;
    }

    // Update the ingredient
    if (name) ingredients[ingredientIndex].name = name;
    if (category) ingredients[ingredientIndex].category = category;

    // Write the updated data back to the file
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    res.status(200).json({ message: "Ingredient updated successfully.", ingredient: ingredients[ingredientIndex] });
  } catch (error) {
    console.error("Error editing ingredient:", error);
    res.status(500).json({ message: "Error editing ingredient." });
  }
};

// Delete an ingredient from the database
const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "ID is required." });
    return;
  }

  try {
    // Read the existing data
    const data = await fs.readFile(ingredientsPath, "utf-8");
    const ingredients = JSON.parse(data);

    // Find the ingredient by ID
    const ingredientIndex = ingredients.findIndex((ingredient: any) => ingredient.id === id);
    if (ingredientIndex === -1) {
      res.status(404).json({ message: "Ingredient not found." });
      return;
    }

    // Remove the ingredient
    const deletedIngredient = ingredients.splice(ingredientIndex, 1);

    // Write the updated data back to the file
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    res.status(200).json({ message: "Ingredient deleted successfully.", ingredient: deletedIngredient });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ message: "Error deleting ingredient." });
  }
};

export default {
  recognize,
  getAllIngredients,
  getIngredientById,
  getIngredientsByQuery,
  addIngredient,
  editIngredient,  
  deleteIngredient,
};