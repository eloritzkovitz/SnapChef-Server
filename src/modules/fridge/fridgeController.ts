import { Request, Response } from "express";
import fridgeModel from "./Fridge";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";

// Create a new fridge
const createFridge = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

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
    logger.error("Error creating fridge for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error creating fridge", error });
  }
};

// Get fridge content
const getFridgeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const userId = getUserId(req);

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    logger.info("Fetched fridge content for fridgeId: %s (user: %s)", fridgeId, userId);
    res.status(200).json(fridge.ingredients);
  } catch (error) {
    logger.error("Error fetching fridge content for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error fetching fridge content", error });
  }
};

// Add an item to the fridge
const addFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const { id, name, category, imageURL, quantity } = req.body;
    const userId = getUserId(req);

    // Validate input
    if (!id || !name || !category || !quantity) {
      logger.warn("Attempted to add fridge item with missing fields (fridgeId: %s, user: %s)", fridgeId, userId);
      res.status(400).json({ message: "ID, name, category, and quantity are required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when adding item: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Check if the ingredient already exists in the fridge
    const existingIngredient = fridge.ingredients.find((ingredient) => ingredient.id === id);
    if (existingIngredient) {
      logger.warn("Ingredient already exists in fridge %s: %s (user: %s)", fridgeId, id, userId);
      res.status(400).json({ message: "Ingredient already exists in the fridge" });
      return;
    }

    // Add the ingredient object directly to the fridge's ingredients array
    const newIngredient = { id, name, category, imageURL, quantity };
    fridge.ingredients.push(newIngredient);
    await fridge.save();

    logger.info("Ingredient added to fridge %s: %j (user: %s)", fridgeId, newIngredient, userId);
    res.status(201).json({ message: "Ingredient added successfully", ingredient: newIngredient });
  } catch (error) {
    logger.error("Error adding item to fridge for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error adding item to fridge", error });
  }
};

// Update an item in the fridge
const updateFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const { quantity } = req.body;
    const userId = getUserId(req);

    // Validate input
    if (quantity === undefined || quantity === null || isNaN(quantity)) {
      logger.warn("Invalid quantity for update in fridge %s, item %s (user: %s)", fridgeId, itemId, userId);
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when updating item: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient in the fridge's ingredients array
    const ingredient = fridge.ingredients.find((ingredient) => ingredient.id === itemId);
    if (!ingredient) {
      logger.warn("Ingredient not found in fridge %s for update: %s (user: %s)", fridgeId, itemId, userId);
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }

    // Update the ingredient's quantity
    ingredient.quantity = quantity;
    fridge.markModified("ingredients");
    await fridge.save();

    logger.info("Ingredient updated in fridge %s: %j (user: %s)", fridgeId, ingredient, userId);
    res.status(200).json({ message: "Ingredient updated successfully", ingredient });
  } catch (error) {
    logger.error("Error updating item in fridge for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Delete an item from the fridge
const deleteFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const userId = getUserId(req);

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when deleting item: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient before removing (for logging)
    const ingredientToDelete = fridge.ingredients.find(ingredient => ingredient.id === itemId);
    if (!ingredientToDelete) {
      logger.warn("Ingredient not found in fridge %s for deletion: %s (user: %s)", fridgeId, itemId, userId);
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }

    // Remove the ingredient from the fridge's ingredients array
    fridge.ingredients = fridge.ingredients.filter((ingredient) => ingredient.id !== itemId);
    await fridge.save();

    logger.info("Ingredient deleted from fridge %s: %j (user: %s)", fridgeId, ingredientToDelete, userId);
    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    logger.error("Error deleting item from fridge for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default {
  createFridge,
  getFridgeContent,
  addFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,  
};