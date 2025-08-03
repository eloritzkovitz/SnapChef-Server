import { Request, Response } from "express";
import analyticsController from "../src/modules/analytics/analyticsController";
import metricsService from "../src/modules/analytics/metricsService";
import logService from "../src/modules/analytics/logService";

jest.mock("../src/modules/analytics/metricsService");
jest.mock("../src/modules/analytics/logService");

type MockedLogService = Record<string, jest.Mock>;
type MockedAnalyticsController = Record<string, any>;

const mockResponse = () => {
  const res = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

describe("analyticsController", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {} as Request;
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("getPopularIngredients", () => {
    it("should return data", async () => {
      const data = ["onion", "garlic"];
      (metricsService.getPopularIngredients as jest.Mock).mockResolvedValue(data);

      await analyticsController.getPopularIngredients(req, res);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it("should handle error", async () => {
      (metricsService.getPopularIngredients as jest.Mock).mockRejectedValue(new Error());

      await analyticsController.getPopularIngredients(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getPopularGroceries", () => {
    it("should return data", async () => {
      const data = ["milk", "bread"];
      (metricsService.getPopularGroceries as jest.Mock).mockResolvedValue(data);

      await analyticsController.getPopularGroceries(req, res);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it("should handle error", async () => {
      (metricsService.getPopularGroceries as jest.Mock).mockRejectedValue(new Error());

      await analyticsController.getPopularGroceries(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getActiveUsers", () => {
    it("should use default 'daily' period", async () => {
      const data = [1, 2, 3];
      req.query = {};
      (metricsService.getActiveUsers as jest.Mock).mockResolvedValue(data);

      await analyticsController.getActiveUsers(req, res);
      expect(metricsService.getActiveUsers).toHaveBeenCalledWith("daily");
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it("should use query period", async () => {
      const data = [5, 10];
      req.query = { period: "weekly" };
      (metricsService.getActiveUsers as jest.Mock).mockResolvedValue(data);

      await analyticsController.getActiveUsers(req, res);
      expect(metricsService.getActiveUsers).toHaveBeenCalledWith("weekly");
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it("should handle error", async () => {
      req.query = {};
      (metricsService.getActiveUsers as jest.Mock).mockRejectedValue(new Error());

      await analyticsController.getActiveUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getIngredientTrends", () => {
    it("should return data with default interval", async () => {
      const data = [{ name: "tomato" }];
      req.query = {};
      (metricsService.getIngredientTrends as jest.Mock).mockResolvedValue(data);

      await analyticsController.getIngredientTrends(req, res);
      expect(metricsService.getIngredientTrends).toHaveBeenCalledWith("day");
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it("should handle error", async () => {
      req.query = {};
      (metricsService.getIngredientTrends as jest.Mock).mockRejectedValue(new Error());

      await analyticsController.getIngredientTrends(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getErrorStats", () => {
    it("should return stats", async () => {
      const stats = { errors: 5 };
      (metricsService.getErrorStats as jest.Mock).mockResolvedValue(stats);

      await analyticsController.getErrorStats(req, res);
      expect(res.json).toHaveBeenCalledWith(stats);
    });

    it("should handle error", async () => {
      (metricsService.getErrorStats as jest.Mock).mockRejectedValue(new Error());

      await analyticsController.getErrorStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe.each([
    ["getErrors", "getErrors", "Failed to fetch error logs."],
    ["getWarnings", "getWarnings", "Failed to fetch warning logs."],
    ["getInfo", "getInfo", "Failed to fetch info logs."],
    ["getLogs", "getLogs", "Failed to fetch logs."],
  ])("%s", (methodName, serviceMethod, errorMessage) => {
    it("should return logs", async () => {
      const logs = [{ message: "log1", timestamp: new Date().toISOString() }];
      req.query = {};

      (((logService as unknown) as MockedLogService)[serviceMethod]).mockResolvedValue(logs);
      await ((analyticsController as unknown) as MockedAnalyticsController)[methodName](req, res);

      expect(((logService as unknown) as MockedLogService)[serviceMethod]).toHaveBeenCalledWith(100);
      expect(res.json).toHaveBeenCalledWith(logs);
    });

    it("should use query.limit if provided", async () => {
      const logs = [{ message: "log2", timestamp: new Date().toISOString() }];
      req.query = { limit: "50" };

      (((logService as unknown) as MockedLogService)[serviceMethod]).mockResolvedValue(logs);
      await ((analyticsController as unknown) as MockedAnalyticsController)[methodName](req, res);

      expect(((logService as unknown) as MockedLogService)[serviceMethod]).toHaveBeenCalledWith(50);
    });

    it("should handle error", async () => {
      req.query = {};

      (((logService as unknown) as MockedLogService)[serviceMethod]).mockRejectedValue(new Error());
      await ((analyticsController as unknown) as MockedAnalyticsController)[methodName](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getDashboardSummary", () => {
    it("should return summary", async () => {
      const summary = { totalUsers: 100, totalErrors: 10 };
      (metricsService.getDashboardSummary as jest.Mock).mockResolvedValue(summary);

      await analyticsController.getDashboardSummary(req, res);
      expect(res.json).toHaveBeenCalledWith(summary);
    });

    it("should handle error", async () => {
      (metricsService.getDashboardSummary as jest.Mock).mockRejectedValue(new Error());

      await analyticsController.getDashboardSummary(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
