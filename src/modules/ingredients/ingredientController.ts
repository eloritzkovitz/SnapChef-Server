import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import  ingredientModel from './Ingredient';
import { loadIngredientData } from './ingredientService';
import logger from '../../utils/logger';
import { getUserId } from '../../utils/requestHelpers';

const ingredientsPath = path.resolve(process.cwd(), 'data/ingredientData.json');

// Get all ingredients
const getAllIngredients = async (req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await loadIngredientData();
    logger.info('Fetched all ingredients (%d items)', ingredients.length);
    res.json(ingredients);
  } catch (error) {
    logger.error('Error fetching ingredients: %o', error);
    res.status(500).json({ error: 'Failed to fetch ingredients.' });
  }
}

// Find ingredient by ID
const getIngredientById = async(req: Request, res: Response): Promise<void> => {
  const _id = req.params.id;
  if (!_id) {
    logger.warn('No ID parameter provided for getIngredientById');
    res.status(400).json({ error: "ID parameter is required" });
    return;
  }

  try {
    const ingredient = await ingredientModel.findOne({id: _id}).select("id name category imageURL");
    if (!ingredient) {
      logger.warn('Ingredient not found by ID: %s', _id);
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }
    logger.info('Fetched ingredient by ID: %s', _id);
    res.json(ingredient);
  } catch (error) {
    logger.error('Error fetching ingredient by ID %s: %o', _id, error);
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
      logger.warn("No query parameter provided for getIngredientsByQuery");
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
      logger.warn("No ingredients found matching query: name=%s, category=%s", name, category);
      res.status(404).json({ error: "No ingredients found matching the query." });
      return;
    }
    
    logger.info("Fetched %d ingredients by query: name=%s, category=%s", ingredients.length, name, category);
    res.status(200).json(ingredients);
  } catch (error) {
    logger.error("Error fetching ingredients by query: %o", error);
    res.status(500).json({ error: "Error fetching ingredients." });
  }
};

// Add a new ingredient to the database
const addIngredient = async (req: Request, res: Response): Promise<void> => {
  const { name, category, imageURL } = req.body;
  const userId = getUserId(req);

  if (!name || !category) {
    logger.warn("Attempted to add ingredient with missing fields");
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
      logger.warn("Attempted to add duplicate ingredient: %s", name);
      res.status(400).json({ message: "Ingredient with this name already exists." });
      return;
    }

    // Create the new ingredient
    const newIngredient = {
      id: newId,
      name,
      category,
      imageURL : null,
    };

    // Add the new ingredient
    ingredients.push(newIngredient);

    // Write the updated data back to the file
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    logger.info("Ingredient added: %j by user: %s", newIngredient, userId);
    res.status(201).json(newIngredient);
  } catch (error) {
    logger.error("Error adding ingredient by user: %s: %o", userId, error);
    res.status(500).json({ message: "Error adding ingredient." });
  }
};

// Edit an existing ingredient in the database
const editIngredient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, category, imageURL } = req.body;
  const userId = getUserId(req);

  if (!id || (!name && !category)) {
    logger.warn("Attempted to edit ingredient with missing fields by user: %s", userId);
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
      logger.warn("Attempted to edit non-existent ingredient: %s", id);
      res.status(404).json({ message: "Ingredient not found." });
      return;
    }

    // Update the ingredient
    if (name) ingredients[ingredientIndex].name = name;
    if (category) ingredients[ingredientIndex].category = category;
    if (imageURL) ingredients[ingredientIndex].imageURL = imageURL;

    // Write the updated data back to the file
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    logger.info("Ingredient edited: %j by user: %s", ingredients[ingredientIndex], userId);
    res.status(200).json({ message: "Ingredient updated successfully.", ingredient: ingredients[ingredientIndex] });
  } catch (error) {
    logger.error("Error editing ingredient %s by user: %s: %o", id, userId, error);
    res.status(500).json({ message: "Error editing ingredient." });
  }
};

// Delete an ingredient from the database
const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getUserId(req);

  if (!id) {
    logger.warn("Attempted to delete ingredient without ID by user: %s", userId);
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
      logger.warn("Attempted to delete non-existent ingredient: %s", id);
      res.status(404).json({ message: "Ingredient not found." });
      return;
    }

    // Remove the ingredient
    const deletedIngredient = ingredients.splice(ingredientIndex, 1);

    // Write the updated data back to the file
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    logger.info("Ingredient deleted: %j by user: %s", deletedIngredient[0], userId);
    res.status(200).json({ message: "Ingredient deleted successfully.", ingredient: deletedIngredient });
  } catch (error) {
    logger.error("Error deleting ingredient %s by user: %s: %o", id, userId, error);
    res.status(500).json({ message: "Error deleting ingredient." });
  }
};

export default {  
  getAllIngredients,
  getIngredientById,
  getIngredientsByQuery,
  addIngredient,
  editIngredient,  
  deleteIngredient,
};