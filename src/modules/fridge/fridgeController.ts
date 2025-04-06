import { Request, Response } from "express";
import fridgeModel from "./Fridge";

// Create a new fridge
const createFridge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const fridge = await fridgeModel.create({ ownerId: userId, ingredients: [] });
    res.status(201).json(fridge);
  } catch (error) {
    console.error("Error creating fridge:", error);
    res.status(500).json({ message: "Error creating fridge", error });
  }
};

// Get fridge content
const getFridgeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    res.status(200).json(fridge.ingredients);
  } catch (error) {
    console.error("Error fetching fridge content:", error);
    res.status(500).json({ message: "Error fetching fridge content", error });
  }
};

// Add an item to the fridge
const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId } = req.params;
    const { id, name, category, imageURL, quantity } = req.body;

    // Validate input
    if (!id || !name || !category || !quantity) {
      res.status(400).json({ message: "ID, name, category, and quantity are required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Check if the ingredient already exists in the fridge
    const existingIngredient = fridge.ingredients.find((ingredient) => ingredient.id === id);
    if (existingIngredient) {
      res.status(400).json({ message: "Ingredient already exists in the fridge" });
      return;
    }

    // Add the ingredient object directly to the fridge's ingredients array
    fridge.ingredients.push({ id, name, category, imageURL, quantity });
    await fridge.save();

    res.status(201).json({ message: "Ingredient added successfully", ingredient: { id, name, category, imageURL, quantity } });
  } catch (error) {
    console.error("Error adding item to fridge:", error);
    res.status(500).json({ message: "Error adding item to fridge", error });
  }
};

const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params; // `id` is the fridge ID, `itemId` is the ingredient ID
    const { quantity } = req.body;

    // Validate input
    if (quantity === undefined || quantity === null || isNaN(quantity)) {
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient in the fridge's ingredients array
    const ingredient = fridge.ingredients.find((ingredient) => ingredient.id === itemId);
    if (!ingredient) {
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }

    // Update the ingredient's quantity
    ingredient.quantity = quantity;

    // Explicitly mark the ingredients array as modified
    fridge.markModified("ingredients");

    // Save the updated fridge
    await fridge.save();

    res.status(200).json({ message: "Ingredient updated successfully", ingredient });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Delete an item from the fridge
const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Remove the ingredient from the fridge's ingredients array
    const initialLength = fridge.ingredients.length;
    fridge.ingredients = fridge.ingredients.filter((ingredient) => ingredient.id !== itemId);

    // Check if the ingredient was actually removed
    if (fridge.ingredients.length === initialLength) {
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }

    // Save the updated fridge
    await fridge.save();

    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default { createFridge, getFridgeContent, addItem, updateItem, deleteItem };