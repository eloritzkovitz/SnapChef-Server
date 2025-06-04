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

// Active users (e.g., daily/weekly/monthly)
const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "daily"; // daily, weekly, monthly
    const data = await analyticsService.getActiveUsers(period);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active users." });
  }
};

// Ingredient trends over time
const getIngredientTrends = async (req: Request, res: Response) => {
  try {
    const interval = (req.query.interval as string) || "day";
    const data = await analyticsService.getIngredientTrends(interval);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredient trends." });
  }
};

// Error statistics (aggregated from logs)
const getErrorStats = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getErrorStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch error stats." });
  }
};

// Get error logs (paginated)
const getErrors = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  try {
    const data = await analyticsService.getErrors(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch error logs." });
  }
};

// Get warning logs (paginated)
const getWarnings = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  try {
    const data = await analyticsService.getWarnings(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warning logs." });
  }
};

// Get info logs (paginated)
const getInfo = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  try {
    const data = await analyticsService.getInfo(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch info logs." });
  }
};

// Get all logs (paginated)
const getLogs = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  try {
    const data = await analyticsService.getLogs(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs." });
  }
};

// General dashboard summary (for admin)
const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getDashboardSummary();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard summary." });
  }
};

export default {
  getPopularIngredients,
  getPopularGroceries,
  getActiveUsers,
  getIngredientTrends,
  getErrorStats,  
  getErrors,
  getWarnings,
  getInfo,
  getLogs,
  getDashboardSummary,
};