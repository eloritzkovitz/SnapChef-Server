import { Request, Response } from "express";
import fridgeModel from "./Fridge";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";

// Fetch groceries list
const getGroceriesList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const userId = getUserId(req);

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when fetching groceries: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    logger.info("Fetched groceries list for fridgeId: %s (user: %s)", fridgeId, userId);
    res.status(200).json(fridge.groceries);
  } catch (error) {
    logger.error("Error fetching groceries list for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error fetching groceries list", error });
  }
};

// Add an item to the groceries list
const addGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const { id, name, category, imageURL, quantity } = req.body;
    const userId = getUserId(req);

    // Validate input
    if (!id || !name || !category || !quantity) {
      logger.warn("Attempted to add grocery item with missing fields (fridgeId: %s, user: %s)", fridgeId, userId);
      res.status(400).json({ message: "ID, name, category, and quantity are required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when adding grocery item: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Check if the ingredient already exists in the list
    const existingIngredient = fridge.groceries.find((ingredient) => ingredient.id === id);
    if (existingIngredient) {
      logger.warn("Ingredient already exists in groceries for fridge %s: %s (user: %s)", fridgeId, id, userId);
      res.status(400).json({ message: "Ingredient already exists in the list" });
      return;
    }

    // Add the ingredient object directly to the fridge's groceries array
    const newIngredient = { id, name, category, imageURL, quantity };
    fridge.groceries.push(newIngredient);
    await fridge.save();

    logger.info("Grocery item added to fridge %s: %j (user: %s)", fridgeId, newIngredient, userId);
    res.status(201).json({ message: "Grocery item added successfully", ingredient: newIngredient });
  } catch (error) {
    logger.error("Error adding item to groceries list for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error adding item to groceries list", error });
  }
};

// Update an item in the groceries list
const updateGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const { quantity } = req.body;
    const userId = getUserId(req);

    // Validate input
    if (quantity === undefined || quantity === null || isNaN(quantity)) {
      logger.warn("Invalid quantity for grocery update in fridge %s, item %s (user: %s)", fridgeId, itemId, userId);
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when updating grocery item: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient in the fridge's groceries array
    const ingredient = fridge.groceries.find((ingredient) => ingredient.id === itemId);
    if (!ingredient) {
      logger.warn("Ingredient not found in groceries for update in fridge %s: %s (user: %s)", fridgeId, itemId, userId);
      res.status(404).json({ message: "Ingredient not found in this groceries list" });
      return;
    }

    // Update the ingredient's quantity
    ingredient.quantity = quantity;
    fridge.markModified("ingredients");
    await fridge.save();

    logger.info("Grocery item updated in fridge %s: %j (user: %s)", fridgeId, ingredient, userId);
    res.status(200).json({ message: "Ingredient updated successfully", ingredient });
  } catch (error) {
    logger.error("Error updating item in groceries list for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Update grocery item image
const updateGroceryItemImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const { imageURL } = req.body;
    const userId = getUserId(req);

    if (!imageURL) {
      res.status(400).json({ message: "imageURL is required" });
      return;
    }

    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when updating grocery image: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    const ingredient = fridge.groceries.find((ingredient) => ingredient.id === itemId);
    if (!ingredient) {
      logger.warn("Grocery item not found in fridge %s for image update: %s (user: %s)", fridgeId, itemId, userId);
      res.status(404).json({ message: "Grocery item not found in this fridge" });
      return;
    }

    ingredient.imageURL = imageURL;
    fridge.markModified("groceries");
    await fridge.save();

    logger.info("Grocery item image updated in fridge %s: %j (user: %s)", fridgeId, ingredient, userId);
    res.status(200).json({ message: "Grocery item image updated successfully", ingredient });
  } catch (error) {
    logger.error("Error updating grocery item image in fridge for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error updating grocery item image", error });
  }
};

// Reorder groceries
const reorderGroceries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const { orderedItemIds } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
      res.status(400).json({ message: "orderedItemIds must be a non-empty array" });
      return;
    }

    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when reordering groceries: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Create a map for quick lookup
    const itemMap: { [id: string]: any } = {};
    for (const item of fridge.groceries) {
      itemMap[item.id] = item;
    }

    // Build the new ordered array
    const newOrderedItems = [];
    for (const id of orderedItemIds) {
      if (itemMap[id]) {
        newOrderedItems.push(itemMap[id]);
      }
    }

    // Replace the groceries array
    fridge.groceries = newOrderedItems;
    await fridge.save();

    logger.info(
      "Groceries reordered for fridge %s (user: %s): %j",
      fridgeId,
      userId,
      orderedItemIds
    );
    res.status(200).json({ message: "Groceries reordered", groceries: fridge.groceries });
  } catch (error) {
    logger.error(
      "Error reordering groceries for user %s: %o",
      getUserId(req),
      error
    );
    res.status(500).json({ message: "Failed to reorder groceries", error });
  }
};

// Delete an item from the groceries list
const deleteGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;
    const userId = getUserId(req);

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      logger.warn("Fridge not found when deleting grocery item: %s (user: %s)", fridgeId, userId);
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient before removing (for logging)
    const ingredientToDelete = fridge.groceries.find(ingredient => ingredient.id === itemId);
    if (!ingredientToDelete) {
      logger.warn("Ingredient not found in groceries for deletion in fridge %s: %s (user: %s)", fridgeId, itemId, userId);
      res.status(404).json({ message: "Ingredient not found in this groceries list" });
      return;
    }

    // Remove the ingredient from the fridge's groceries array
    fridge.groceries = fridge.groceries.filter((ingredient) => ingredient.id !== itemId);

    // Save the updated fridge
    await fridge.save();

    logger.info("Grocery item deleted from fridge %s: %j (user: %s)", fridgeId, ingredientToDelete, userId);
    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    logger.error("Error deleting item from groceries list for user %s: %o", getUserId(req), error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default {  
  getGroceriesList,
  addGroceryItem,
  updateGroceryItem,
  updateGroceryItemImage,
  reorderGroceries,
  deleteGroceryItem
};