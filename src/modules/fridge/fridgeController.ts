import { Request, Response } from "express";
import fridgeModel from "./Fridge";
import { Ingredient } from "../ingredients/Ingredient";

// Create a new fridge
const createFridge = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const fridge = await fridgeModel.create({ user: userId, ingredients: [] });
    res.status(201).json(fridge);
  } catch (error) {
    res.status(500).json({ message: "Error creating fridge", error });
  }
};

// Get fridge content
const getFridgeContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fridge = await fridgeModel.findById(id).populate("ingredients");
    if (!fridge) {
      return res.status(404).json({ message: "Fridge not found" });
    }
    res.status(200).json(fridge.ingredients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fridge content", error });
  }
};

// Add a new item to the fridge
const addItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, expiryDate, imageURL } = req.body;

    const fridge = await fridgeModel.findById(id);
    if (!fridge) {
      return res.status(404).json({ message: "Fridge not found" });
    }

    const newItem: IIngredient = { name, category, quantity, expiryDate, imageURL };
    fridge.ingredients.push(newItem);
    await fridge.save();

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Error adding item to fridge", error });
  }
};

// Update an item in the fridge
const updateItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { name, category, quantity, expiryDate } = req.body;

    const fridge = await fridgeModel.findOneAndUpdate(
      { "ingredients._id": itemId },
      {
        $set: {
          "ingredients.$.name": name,
          "ingredients.$.category": category,
          "ingredients.$.quantity": quantity,
          "ingredients.$.expiryDate": expiryDate,
        },
      },
      { new: true }
    );

    if (!fridge) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating item", error });
  }
};

// Delete an item from the fridge
const deleteItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    const fridge = await fridgeModel.findOneAndUpdate(
      { "ingredients._id": itemId },
      { $pull: { ingredients: { _id: itemId } } },
      { new: true }
    );

    if (!fridge) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error });
  }
};

export default { createFridge, getFridgeContent, addItem, updateItem, deleteItem };