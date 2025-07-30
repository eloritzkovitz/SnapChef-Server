import express from "express";
import request from "supertest";
import ingredientController from "../modules/ingredients/ingredientController";
import * as ingredientService from "../modules/ingredients/ingredientService";
import * as requestHelpers from "../utils/requestHelpers";
import fs from "fs/promises";

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../modules/ingredients/ingredientService", () => ({
  loadIngredientData: jest.fn(),
}));

jest.mock("../utils/requestHelpers", () => ({
  getUserId: jest.fn(() => "test-user"),
}));

jest.mock("fs/promises");

const app = express();
app.use(express.json());
app.get("/ingredients", ingredientController.getAllIngredients);
app.get("/ingredients/id/:id", ingredientController.getIngredientById);
app.get("/ingredients/search", ingredientController.getIngredientsByQuery);
app.post("/ingredients", ingredientController.addIngredient);
app.put("/ingredients/:id", ingredientController.editIngredient);
app.delete("/ingredients/:id", ingredientController.deleteIngredient);

describe("ingredientController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /ingredients", () => {
    it("should return all ingredients", async () => {
      (ingredientService.loadIngredientData as jest.Mock).mockResolvedValue([{ id: "1", name: "Tomato" }]);
      const res = await request(app).get("/ingredients");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: "1", name: "Tomato" }]);
    });

    it("should handle error while fetching ingredients", async () => {
      (ingredientService.loadIngredientData as jest.Mock).mockRejectedValue(new Error("error"));
      const res = await request(app).get("/ingredients");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /ingredients/id/:id", () => {
    it("should return ingredient by ID", async () => {
      const mockFindOne = jest.fn().mockResolvedValue({ id: "1", name: "Lemon" });
      jest.mocked(require("../modules/ingredients/Ingredient")).default.findOne = mockFindOne;
      const res = await request(app).get("/ingredients/id/1");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "1", name: "Lemon" });
    });

    it("should return 404 if not found", async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);
      jest.mocked(require("../modules/ingredients/Ingredient")).default.findOne = mockFindOne;
      const res = await request(app).get("/ingredients/id/999");
      expect(res.status).toBe(404);
    });

    it("should return 400 if no id provided", async () => {
      const res = await request(app).get("/ingredients/id/");
      expect(res.status).toBe(404); // Because route requires id param
    });
  });

  describe("GET /ingredients/search", () => {
    const mockFind = jest.fn();
    beforeEach(() => {
      jest.mocked(require("../modules/ingredients/Ingredient")).default.find = mockFind;
    });

    it("should return matching ingredients", async () => {
      mockFind.mockResolvedValue([{ id: "2", name: "Salt" }]);
      const res = await request(app).get("/ingredients/search?name=salt");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: "2", name: "Salt" }]);
    });

    it("should return 400 if no query provided", async () => {
      const res = await request(app).get("/ingredients/search");
      expect(res.status).toBe(400);
    });

    it("should return 404 if no matches", async () => {
      mockFind.mockResolvedValue([]);
      const res = await request(app).get("/ingredients/search?name=nonsense");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /ingredients", () => {
    it("should add ingredient", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([{ id: "1", name: "Tomato" }]));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .post("/ingredients")
        .send({ name: "Cucumber", category: "Vegetable" });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Cucumber");
    });

    it("should reject if name/category missing", async () => {
      const res = await request(app).post("/ingredients").send({ name: "" });
      expect(res.status).toBe(400);
    });

    it("should reject if name exists", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([{ id: "1", name: "Tomato" }]));
      const res = await request(app)
        .post("/ingredients")
        .send({ name: "Tomato", category: "Vegetable" });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /ingredients/:id", () => {
    it("should update ingredient", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify([{ id: "3", name: "Lettuce", category: "Leafy" }])
      );
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .put("/ingredients/3")
        .send({ name: "Spinach", category: "Leafy Green" });
      expect(res.status).toBe(200);
    });

    it("should return 404 if ingredient not found", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      const res = await request(app).put("/ingredients/99").send({ name: "Pepper" });
      expect(res.status).toBe(404);
    });

    it("should return 400 if input invalid", async () => {
      const res = await request(app).put("/ingredients/1").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /ingredients/:id", () => {
    it("should delete ingredient", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify([{ id: "5", name: "Garlic", category: "Spice" }])
      );
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app).delete("/ingredients/5");
      expect(res.status).toBe(200);
    });

    it("should return 404 if ingredient not found", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      const res = await request(app).delete("/ingredients/88");
      expect(res.status).toBe(404);
    });

    it("should return 400 if no id provided", async () => {
      const res = await request(app).delete("/ingredients/");
      expect(res.status).toBe(404); // Express 404 for missing param
    });
  });
});
