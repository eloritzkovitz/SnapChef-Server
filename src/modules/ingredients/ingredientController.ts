import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { recognizePhoto, recognizeReceipt, recognizeBarcode } from './imageRecognition';
import ingredientModel from './Ingredient';
import { loadIngredientData } from '../../utils/ingredientData';
import { logActivity } from '../../utils/logService';

const ingredientsPath = path.resolve(process.cwd(), 'data/ingredientData.json');

export const recognize = async (req: Request, res: Response, type: string): Promise<void> => {
  console.log(`Received POST request at /recognize/${type}`);
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    let result;
    try {
      switch (type) {
        case 'photo':
          result = await recognizePhoto(file.path);
          break;
        case 'receipt':
          result = await recognizeReceipt(file.path);
          break;
        case 'barcode':
          result = await recognizeBarcode(file.path);
          break;
        default:
          res.status(400).json({ error: 'Invalid recognition type.' });
          return;
      }

      res.json(result);
    } finally {
      await fs.unlink(file.path).catch((err) => {
        console.error(`Error deleting file ${file.path}:`, err);
      });
    }
  } catch (error) {
    console.error(`Error recognizing ${type}:`, error);
    res.status(500).json({ error: 'Failed to recognize image.' });
  }
};

const getAllIngredients = async (req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await loadIngredientData();
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients.' });
  }
};

const getIngredientById = async(req: Request, res: Response): Promise<void> => {
  const _id = req.params.id;
  if (!_id) {
    res.status(400).json({ error: "ID parameter is required" });
    return;
  }

  try {
    const ingredient = await ingredientModel.findOne({ id: _id }).select("id name category imageURL");

    await logActivity((req as any).user?.id, 'read', 'ingredient', _id, {});

    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ingredients" });
  }
};

const getIngredientsByQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category } = req.query;

    if (!name && !category) {
      res.status(400).json({ error: "At least one query parameter ('name' or 'category') is required." });
      return;
    }

    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };

    const ingredients = await ingredientModel.find(filter).select("id name category imageURL");

    if (ingredients.length === 0) {
      res.status(404).json({ error: "No ingredients found matching the query." });
      return;
    }

    await logActivity((req as any).user?.id, 'read', 'ingredient', undefined, { filter });

    res.status(200).json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients by query:", error);
    res.status(500).json({ error: "Error fetching ingredients." });
  }
};

const addIngredient = async (req: Request, res: Response): Promise<void> => {
  const { name, category } = req.body;

  if (!name || !category) {
    res.status(400).json({ message: "Name and category are required." });
    return;
  }

  try {
    const data = await fs.readFile(ingredientsPath, "utf-8");
    const ingredients = JSON.parse(data);

    const lastId = ingredients.reduce((maxId: number, ingredient: any) => {
      const currentId = parseInt(ingredient.id, 10);
      return currentId > maxId ? currentId : maxId;
    }, 0);

    const newId = (lastId + 1).toString();

    if (ingredients.some((ingredient: any) => ingredient.name === name)) {
      res.status(400).json({ message: "Ingredient with this name already exists." });
      return;
    }

    const newIngredient = {
      id: newId,
      name,
      category,
    };

    ingredients.push(newIngredient);
    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    await logActivity((req as any).user?.id, 'add', 'ingredient', newId, { ingredient: newIngredient });

    res.status(201).json(newIngredient);
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ message: "Error adding ingredient." });
  }
};

const editIngredient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, category } = req.body;

  if (!id || (!name && !category)) {
    res.status(400).json({ message: "ID and at least one field (name or category) are required." });
    return;
  }

  try {
    const data = await fs.readFile(ingredientsPath, "utf-8");
    const ingredients = JSON.parse(data);

    const ingredientIndex = ingredients.findIndex((ingredient: any) => ingredient.id === id);
    if (ingredientIndex === -1) {
      res.status(404).json({ message: "Ingredient not found." });
      return;
    }

    if (name) ingredients[ingredientIndex].name = name;
    if (category) ingredients[ingredientIndex].category = category;

    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    await logActivity((req as any).user?.id, 'update', 'ingredient', id, { updatedIngredient: ingredients[ingredientIndex] });

    res.status(200).json({ message: "Ingredient updated successfully.", ingredient: ingredients[ingredientIndex] });
  } catch (error) {
    console.error("Error editing ingredient:", error);
    res.status(500).json({ message: "Error editing ingredient." });
  }
};

const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "ID is required." });
    return;
  }

  try {
    const data = await fs.readFile(ingredientsPath, "utf-8");
    const ingredients = JSON.parse(data);

    const ingredientIndex = ingredients.findIndex((ingredient: any) => ingredient.id === id);
    if (ingredientIndex === -1) {
      res.status(404).json({ message: "Ingredient not found." });
      return;
    }

    const deletedIngredient = ingredients.splice(ingredientIndex, 1);

    await fs.writeFile(ingredientsPath, JSON.stringify(ingredients, null, 2), "utf-8");

    await logActivity((req as any).user?.id, 'delete', 'ingredient', id, { deletedIngredient: deletedIngredient[0] });

    res.status(200).json({ message: "Ingredient deleted successfully.", ingredient: deletedIngredient });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ message: "Error deleting ingredient." });
  }
};

export default {
  recognize,
  getAllIngredients,
  getIngredientById,
  getIngredientsByQuery,
  addIngredient,
  editIngredient,
  deleteIngredient,
};
