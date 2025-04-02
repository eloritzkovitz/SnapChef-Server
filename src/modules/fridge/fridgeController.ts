import { Request, Response } from "express";
import fridgeModel from "./Fridge";
import { Ingredient } from "../ingredients/Ingredient";

// Create a new fridge
const createFridge = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const fridge = await fridgeModel.create({ ownerId: userId, ingredients: [] });
    res.status(201).json(fridge);
  } catch (error) {
    res.status(500).json({ message: "Error creating fridge", error });
  }
};

// Get fridge content
const getFridgeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }
    // Return the ingredients array
    const ingredients: Ingredient[] = fridge.ingredients as Ingredient[];
    res.status(200).json(ingredients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fridge content", error });
  }
};

// Add an item to the fridge
const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, imageURL, quantity } = req.body;

    // Validate required fields
    if (!name || !category || !imageURL || !quantity) {
      res.status(400).json({ message: "All fields (name, category, imageURL, quantity) are required." });
      return;
    }

    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Create a new ingredient object
    const newItem = { name, category, imageURL, quantity };
    fridge.ingredients.push(newItem as Ingredient);
    await fridge.save();

    res.status(201).json({ message: "Ingredient added successfully", ingredient: newItem });
  } catch (error) {
    res.status(500).json({ message: "Error adding item to fridge", error });
  }
};

// Update an item in the fridge
const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;

    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient by its ID
    const ingredient = fridge.ingredients.find((item) => item._id?.toString() === itemId);
    if (!ingredient) {
      res.status(404).json({ message: "Ingredient not found" });
      return;
    }

    // Update the quantity  
    ingredient.quantity = quantity || ingredient.quantity;    

    await fridge.save();
    res.status(200).json({ message: "Ingredient updated successfully", ingredient });
  } catch (error) {
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Delete an item from the fridge
const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;

    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Remove the ingredient by its ID
    fridge.ingredients = fridge.ingredients.filter(
      (ingredient) => ingredient._id?.toString() !== itemId
    );

    await fridge.save();
    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default { createFridge, getFridgeContent, addItem, updateItem, deleteItem };