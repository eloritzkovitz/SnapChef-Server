import { Request, Response } from "express";
import analyticsService from "./analyticsService";

// Popular ingredients
const getPopularIngredients = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getPopularIngredients();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch popular ingredients." });
  }
};

// Popular groceries
const getPopularGroceries = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getPopularGroceries();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch popular groceries." });
  }
};

// Popular recipes
const getPopularRecipes = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getPopularRecipes();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch popular recipes." });
  }
};

// Active users
const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getActiveUsers();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active users." });
  }
};

// Ingredient trends over time
const getIngredientTrends = async (req: Request, res: Response) => {
  try {
    const interval = req.query.interval as string || "day";
    const data = await analyticsService.getIngredientTrends(interval);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredient trends." });
  }
};

// Error stats
const getErrorStats = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getErrorStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch error stats." });
  }
};

export default {
  getPopularIngredients,
  getPopularGroceries,
  getPopularRecipes,
  getActiveUsers,
  getIngredientTrends,
  getErrorStats,
};