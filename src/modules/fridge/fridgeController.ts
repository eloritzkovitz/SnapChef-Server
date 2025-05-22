import { Request, Response } from "express";
import fridgeModel from "./Fridge";
import logger from "../../utils/logger";

// Create a new fridge
const createFridge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      logger.warn("Attempted to create fridge without userId");
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const fridge = await fridgeModel.create({ ownerId: userId, ingredients: [], groceries: [] });
    
    logger.info("Fridge created for user: %s (fridgeId: %s)", userId, fridge._id);    
    res.status(201).json(fridge);
  } catch (error) {
    logger.error("Error creating fridge: %o", error);
    res.status(500).json({ message: "Error creating fridge", error });
  }
};

// Get fridge content
const getFridgeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    logger.info("Fetched fridge content for fridgeId: %s", fridgeId);
    res.status(200).json(fridge.ingredients);
  } catch (error) {
    console.error("Error fetching fridge content:", error);
    logger.error("Error fetching fridge content: %o", error);
    res.status(500).json({ message: "Error fetching fridge content", error });
  }
};

// Add an item to the fridge
const addFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const { id, name, category, imageURL, quantity } = req.body;

    // Validate input
    if (!id || !name || !category || !quantity) {
      logger.warn("Attempted to add fridge item with missing fields (fridgeId: %s)", fridgeId);
      res.status(400).json({ message: "ID, name, category, and quantity are required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when adding item: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Check if the ingredient already exists in the fridge
    const existingIngredient = fridge.ingredients.find((ingredient) => ingredient.id === id);
    if (existingIngredient) {
      logger.warn("Ingredient already exists in fridge %s: %s", fridgeId, id);
      res.status(400).json({ message: "Ingredient already exists in the fridge" });
      return;
    }

    // Add the ingredient object directly to the fridge's ingredients array
    const newIngredient = { id, name, category, imageURL, quantity };
    fridge.ingredients.push(newIngredient);
    await fridge.save();    

    logger.info("Ingredient added to fridge %s: %j", fridgeId, newIngredient);
    res.status(201).json({ message: "Ingredient added successfully", ingredient: newIngredient });
  } catch (error) {
    logger.error("Error adding item to fridge: %o", error);
    res.status(500).json({ message: "Error adding item to fridge", error });
  }
};

// Update an item in the fridge
const updateFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (quantity === undefined || quantity === null || isNaN(quantity)) {
      logger.warn("Invalid quantity for update in fridge %s, item %s", fridgeId, itemId);
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when updating item: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient in the fridge's ingredients array
    const ingredient = fridge.ingredients.find((ingredient) => ingredient.id === itemId);
    if (!ingredient) {
      logger.warn("Ingredient not found in fridge %s for update: %s", fridgeId, itemId);
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }    

    // Update the ingredient's quantity
    ingredient.quantity = quantity;    
    fridge.markModified("ingredients");    
    await fridge.save();    

    logger.info("Ingredient updated in fridge %s: %j", fridgeId, ingredient);
    res.status(200).json({ message: "Ingredient updated successfully", ingredient });
  } catch (error) {
    console.error("Error updating item:", error);
    logger.error("Error updating item in fridge: %o", error);
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Delete an item from the fridge
const deleteFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when deleting item: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient before removing (for logging)
    const ingredientToDelete = fridge.ingredients.find(ingredient => ingredient.id === itemId);
    if (!ingredientToDelete) {
      logger.warn("Ingredient not found in fridge %s for deletion: %s", fridgeId, itemId);
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }

    // Remove the ingredient from the fridge's ingredients array
    fridge.ingredients = fridge.ingredients.filter((ingredient) => ingredient.id !== itemId);
    await fridge.save();    

    logger.info("Ingredient deleted from fridge %s: %j", fridgeId, ingredientToDelete);
    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    logger.error("Error deleting item from fridge: %o", error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

// Fetch groceries list
const getGroceriesList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when fetching groceries: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    res.status(200).json(fridge.groceries);
  } catch (error) {
    logger.error("Error fetching groceries list: %o", error);
    res.status(500).json({ message: "Error fetching groceries list", error });
  }
};

// Add an item to the groceries list
const addGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const { id, name, category, imageURL, quantity } = req.body;

    // Validate input
    if (!id || !name || !category || !quantity) {
      logger.warn("Attempted to add grocery item with missing fields (fridgeId: %s)", fridgeId);
      res.status(400).json({ message: "ID, name, category, and quantity are required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when adding grocery item: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Check if the ingredient already exists in the list
    const existingIngredient = fridge.groceries.find((ingredient) => ingredient.id === id);
    if (existingIngredient) {
      logger.warn("Ingredient already exists in groceries for fridge %s: %s", fridgeId, id);
      res.status(400).json({ message: "Ingredient already exists in the list" });
      return;
    }

    // Add the ingredient object directly to the fridge's groceries array
    const newIngredient = { id, name, category, imageURL, quantity };
    fridge.groceries.push(newIngredient);
    await fridge.save();    

    logger.info("Grocery item added to fridge %s: %j", fridgeId, newIngredient);
    res.status(201).json({ message: "Grocery item added successfully", ingredient: newIngredient });
  } catch (error) {
    logger.error("Error adding item to groceries list: %o", error);
    res.status(500).json({ message: "Error adding item to groceries list", error });
  }
};

// Update an item in the groceries list
const updateGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (quantity === undefined || quantity === null || isNaN(quantity)) {
      logger.warn("Invalid quantity for grocery update in fridge %s, item %s", fridgeId, itemId);
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when updating grocery item: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }
    
    // Find the ingredient in the fridge's groceries array
    const ingredient = fridge.groceries.find((ingredient) => ingredient.id === itemId);
    if (!ingredient) {
      logger.warn("Ingredient not found in groceries for update in fridge %s: %s", fridgeId, itemId);
      res.status(404).json({ message: "Ingredient not found in this groceries list" });
      return;
    }

    // Update the ingredient's quantity
    ingredient.quantity = quantity;    
    fridge.markModified("ingredients");    
    await fridge.save(); 
    
    logger.info("Grocery item updated in fridge %s: %j", fridgeId, ingredient);
    res.status(200).json({ message: "Ingredient updated successfully", ingredient });
  } catch (error) {
    logger.error("Error updating item in groceries list: %o", error);
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Delete an item from the groceries list
const deleteGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when deleting grocery item: %s", fridgeId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient before removing (for logging)
    const ingredientToDelete = fridge.groceries.find(ingredient => ingredient.id === itemId);
    if (!ingredientToDelete) {
      logger.warn("Ingredient not found in groceries for deletion in fridge %s: %s", fridgeId, itemId);
      res.status(404).json({ message: "Ingredient not found in this groceries list" });
      return;
    }

    // Remove the ingredient from the fridge's groceries array
    fridge.groceries = fridge.groceries.filter((ingredient) => ingredient.id !== itemId);

    // Save the updated fridge
    await fridge.save();    

    logger.info("Grocery item deleted from fridge %s: %j", fridgeId, ingredientToDelete);
    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    logger.error("Error deleting item from groceries list: %o", error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default { createFridge, getFridgeContent, addFridgeItem, updateFridgeItem, deleteFridgeItem, getGroceriesList, addGroceryItem, updateGroceryItem, deleteGroceryItem };