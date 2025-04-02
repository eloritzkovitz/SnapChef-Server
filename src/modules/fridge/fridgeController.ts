import { Request, Response } from "express";
import FridgeItem from "./Fridge";

// Create a new item
export const addItem = async (req: Request, res: Response) => {
  try {
    const item = await FridgeItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: "Failed to add item", details: err });
  }
};

// Get all items / filter by category
export const getItems = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await FridgeItem.find(filter);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

// Search by name
export const searchItems = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const items = await FridgeItem.find({ name: { $regex: q, $options: "i" } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to search items" });
  }
};

// Update item
export const updateItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updated = await FridgeItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update item" });
  }
};

// Delete item
export const deleteItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deleted = await FridgeItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
};
