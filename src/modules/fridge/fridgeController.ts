import { Request, Response } from "express";
import fridgeModel from "./Fridge";
import ingredientModel from "../ingredients/Ingredient";

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

    // Find the fridge and populate the ingredients
    const fridge = await fridgeModel.findById(id).populate("ingredients");
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
    if (!name || !category || !quantity) {
      res.status(400).json({ message: "Name, category, and quantity are required" });
      return;
    }

    // Create the ingredient in the Ingredients collection
    const ingredient = await ingredientModel.create({ id, name, category, imageURL, quantity });

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Add the ingredient's ID to the fridge's ingredients array
    fridge.ingredients.push(ingredient._id as typeof fridge.ingredients[0]);
    await fridge.save();

    res.status(201).json({ message: "Ingredient added successfully", ingredient });
  } catch (error) {
    console.error("Error adding item to fridge:", error);
    res.status(500).json({ message: "Error adding item to fridge", error });
  }
};

// Update an item in the fridge
const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (!quantity) {
      res.status(400).json({ message: "Quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient in the Ingredients collection
    const ingredient = await ingredientModel.findOne({ id: itemId });
    if (!ingredient) {
      res.status(404).json({ message: "Ingredient not found" });
      return;
    }

    // Update the ingredient's quantity
    ingredient.quantity = quantity;
    await ingredient.save();

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

    // Remove the ingredient's ID from the fridge's ingredients array
    fridge.ingredients = fridge.ingredients.filter(
      (ingredientId) => ingredientId.toString() !== itemId
    );
    await fridge.save();

    // Optionally, delete the ingredient from the Ingredients collection
    await ingredientModel.findOneAndDelete({ id: itemId });

    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default { createFridge, getFridgeContent, addItem, updateItem, deleteItem };