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
const addFridgeItem = async (req: Request, res: Response): Promise<void> => {
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
    const newIngredient = { id, name, category, imageURL, quantity };
    fridge.ingredients.push(newIngredient);
    await fridge.save();    

    res.status(201).json({ message: "Ingredient added successfully", ingredient: newIngredient });
  } catch (error) {
    console.error("Error adding item to fridge:", error);
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
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
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

    // Store old quantity for logging
    const oldQuantity = ingredient.quantity;

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
const deleteFridgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient before removing (for logging)
    const ingredientToDelete = fridge.ingredients.find(ingredient => ingredient.id === itemId);
    if (!ingredientToDelete) {
      res.status(404).json({ message: "Ingredient not found in this fridge" });
      return;
    }

    // Remove the ingredient from the fridge's ingredients array
    fridge.ingredients = fridge.ingredients.filter((ingredient) => ingredient.id !== itemId);

    // Save the updated fridge
    await fridge.save();    

    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

// Add an item to the groceries list
const addGroceryItem = async (req: Request, res: Response): Promise<void> => {
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

    // Check if the ingredient already exists in the list
    const existingIngredient = fridge.groceries.find((ingredient) => ingredient.id === id);
    if (existingIngredient) {
      res.status(400).json({ message: "Ingredient already exists in the list" });
      return;
    }

    // Add the ingredient object directly to the fridge's groceries array
    const newIngredient = { id, name, category, imageURL, quantity };
    fridge.groceries.push(newIngredient);
    await fridge.save();    

    res.status(201).json({ message: "Grocery item added successfully", ingredient: newIngredient });
  } catch (error) {
    console.error("Error adding item to groceries list:", error);
    res.status(500).json({ message: "Error adding item to groceries list", error });
  }
};

// Delete an item from the groceries list
const deleteGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fridgeId, itemId } = req.params;

    // Find the fridge
    const fridge = await fridgeModel.findById(fridgeId);
    if (!fridge) {
      res.status(404).json({ message: "Fridge not found" });
      return;
    }

    // Find the ingredient before removing (for logging)
    const ingredientToDelete = fridge.ingredients.find(ingredient => ingredient.id === itemId);
    if (!ingredientToDelete) {
      res.status(404).json({ message: "Ingredient not found in this groceries list" });
      return;
    }

    // Remove the ingredient from the fridge's groceries array
    fridge.groceries = fridge.groceries.filter((ingredient) => ingredient.id !== itemId);

    // Save the updated fridge
    await fridge.save();    

    res.status(200).json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default { createFridge, getFridgeContent, addFridgeItem, updateFridgeItem, deleteFridgeItem, addGroceryItem, deleteGroceryItem };