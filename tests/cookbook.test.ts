import request from "supertest";
import express from "express";
import cookbookRoutes from "../src/modules/cookbook/cookbookRoutes";
import cookbookModel from "../src/modules/cookbook/Cookbook";
import SharedRecipe from "../src/modules/cookbook/SharedRecipe";
import userModel from "../src/modules/users/User";
import { sendFcmHttpV1 } from "../src/utils/firebaseMessaging";
import { parseRecipeString } from "../src/modules/recipes/recipeParser";
import { generateImageForRecipe } from "../src/modules/recipes/imageGeneration";
import { getField } from "../src/modules/cookbook/cookbookUtils";
import logger from "../src/utils/logger";
import { getUserId } from "../src/utils/requestHelpers";
import { io } from "../src/server";
import { getUserStatsForSocket } from "../src/modules/users/userUtils";

jest.mock("../src/middlewares/auth", () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.user = { id: "user123" };
    next();
  }),
}));
jest.mock("../modules/cookbook/Cookbook");
jest.mock("../modules/cookbook/SharedRecipe");
jest.mock("../modules/users/User");
jest.mock("../utils/firebaseMessaging");
jest.mock("../modules/recipes/recipeParser");
jest.mock("../modules/recipes/imageGeneration");
jest.mock("../modules/cookbook/cookbookUtils");
jest.mock("../utils/logger");
jest.mock("../utils/requestHelpers");
jest.mock("../modules/users/userUtils");
jest.mock("../server", () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/cookbook", cookbookRoutes);

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockReturnValue("user123");
});

describe("Cookbook Controller", () => {
  describe("GET /api/cookbook/:cookbookId", () => {
    it("200 → returns cookbook when found", async () => {
      const mockCb = { _id: "cb1", recipes: [] };
      (cookbookModel.findById as jest.Mock).mockResolvedValue(mockCb);

      const res = await request(app).get("/api/cookbook/cb1");
      expect(res.status).toBe(200);
      expect(res.body.cookbook).toEqual(mockCb);
    });

    it("404 → when cookbook not found", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get("/api/cookbook/nonexistent");
      expect(res.status).toBe(404);
    });

    it("500 → on database error", async () => {
      (cookbookModel.findById as jest.Mock).mockRejectedValue(new Error("dbfail"));

      const res = await request(app).get("/api/cookbook/cbX");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/cookbook/:cookbookId/recipes", () => {
    const basePath = "/api/cookbook/cb1/recipes";

    it("400 → missing userId", async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const res = await request(app).post(basePath).send({ raw: "anything" });
      expect(res.status).toBe(400);
    });

    it("404 → cookbook not found", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post(basePath).send({ title: "Foo" });
      expect(res.status).toBe(404);
    });

    it("400 → missing title", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [], save: jest.fn() });
      (parseRecipeString as jest.Mock).mockReturnValue({ title: "" });
      const res = await request(app).post(basePath).send({ raw: "no title here" });
      expect(res.status).toBe(400);
    });

    it("200 → adds recipe and emits stats update", async () => {
      const saveMock = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({
        recipes: [],
        save: saveMock,
      });
      (parseRecipeString as jest.Mock).mockReturnValue({ title: "Parsed", description: "", prepTime: 5, cookingTime: 10 });
      (getField as jest.Mock).mockImplementation((obj, key, fallback) => obj[key] ?? fallback);
      (getUserStatsForSocket as jest.Mock).mockResolvedValue({ count: 1 });

      const payload = {
        title: "Front",
        description: "Desc",
        prepTime: 2,
        cookingTime: 3,
        ingredients: ["a"],
        instructions: ["b"],
      };
      const res = await request(app).post(basePath).send(payload);
      expect(res.status).toBe(200);
      expect(saveMock).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith("user123");
    });
  });

  describe("PUT /api/cookbook/:cookbookId/recipes/:recipeId", () => {
    const path = "/api/cookbook/cb1/recipes/r1";

    it("404 → cookbook missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).put(path).send({ title: "X" });
      expect(res.status).toBe(404);
    });

    it("404 → recipe not in cookbook", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [], save: jest.fn() });
      const res = await request(app).put(path).send({ title: "X" });
      expect(res.status).toBe(404);
    });

    it("200 → updates recipe", async () => {
      const rec = { _id: "r1", title: "Old" };
      const saveMock = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({
        recipes: [rec],
        save: saveMock,
      });
      const res = await request(app).put(path).send({ title: "New" });
      expect(res.status).toBe(200);
      expect(res.body.recipe.title).toBe("New");
    });
  });

  describe("PATCH /api/cookbook/:cookbookId/recipes/:recipeId/image", () => {
    const path = "/api/cookbook/cb1/recipes/r1/image";

    it("404 → cookbook missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(404);
    });

    it("404 → recipe missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [] });
      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(404);
    });

    it("500 → image generation failure", async () => {
      const rec = { _id: "r1", title: "T", ingredients: [] };
      const saveMock = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [rec], markModified: jest.fn(), save: saveMock });
      (generateImageForRecipe as jest.Mock).mockResolvedValue(null);

      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(500);
    });

    it("200 → regenerates image", async () => {
      const rec = { _id: "r1", title: "T", ingredients: [] };
      const saveMock = jest.fn();
      const markModified = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [rec], markModified, save: saveMock });
      (generateImageForRecipe as jest.Mock).mockResolvedValue("url");

      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(200);
      expect(res.body.imageUrl).toBe("url");
      expect(markModified).toHaveBeenCalledWith("recipes");
    });
  });

  describe("PATCH /api/cookbook/:cookbookId/recipes/:recipeId/favorite", () => {
    const path = "/api/cookbook/cb1/recipes/r1/favorite";

    it("400 → missing userId", async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(400);
    });

    it("404 → cookbook missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(404);
    });

    it("404 → recipe missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [], save: jest.fn() });
      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(404);
    });

    it("200 → toggles favorite and emits stats", async () => {
      const rec: any = { _id: "r1", isFavorite: false };
      const saveMock = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [rec], markModified: jest.fn(), save: saveMock });
      (getUserStatsForSocket as jest.Mock).mockResolvedValue({ foo: 42 });

      const res = await request(app).patch(path).send({});
      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(true);
      expect(io.to).toHaveBeenCalledWith("user123");
    });
  });

  describe("POST /api/cookbook/:cookbookId/recipes/:recipeId/share", () => {
    const path = "/api/cookbook/cb1/recipes/r1/share";

    it("400 → missing friendId", async () => {
      const res = await request(app).post(path).send({});
      expect(res.status).toBe(400);
    });

    it("404 → user not found", async () => {
      (userModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post(path).send({ friendId: "f1" });
      expect(res.status).toBe(404);
    });

    it("403 → not friends", async () => {
      (userModel.findById as jest.Mock).mockResolvedValue({ friends: [] });
      const res = await request(app).post(path).send({ friendId: "f1" });
      expect(res.status).toBe(403);
    });

    it("404 → cookbook or recipe missing", async () => {
      (userModel.findById as jest.Mock).mockResolvedValue({ friends: ["f1"], firstName: "A" });
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res1 = await request(app).post(path).send({ friendId: "f1" });
      expect(res1.status).toBe(404);

      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [] });
      const res2 = await request(app).post(path).send({ friendId: "f1" });
      expect(res2.status).toBe(404);
    });

    it("200 → shares and notifies", async () => {
      (userModel.findById as jest.Mock)
        .mockResolvedValueOnce({ friends: ["f1"], firstName: "Me" })   // sender
        .mockResolvedValueOnce({ fcmToken: "tok", preferences: { notificationPreferences: { recipeShares: true } } }); // friend

      const recipe = { _id: "r1", title: "T" };
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [recipe] });
      (SharedRecipe.create as jest.Mock).mockResolvedValue({});

      const res = await request(app).post(path).send({ friendId: "f1" });
      expect(res.status).toBe(200);
      expect(sendFcmHttpV1).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/cookbook/:cookbookId/recipes/reorder", () => {
    const path = "/api/cookbook/cb1/recipes/reorder";

    it("400 → invalid array", async () => {
      const res = await request(app).patch(path).send({ orderedRecipeIds: "not array" });
      expect(res.status).toBe(400);
    });

    it("404 → cookbook missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).patch(path).send({ orderedRecipeIds: ["a"] });
      expect(res.status).toBe(404);
    });

    it("200 → reorders recipes", async () => {
      const recs = [{ _id: "a" }, { _id: "b" }];
      const saveMock = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: recs, save: saveMock });
      const res = await request(app).patch(path).send({ orderedRecipeIds: ["b", "a"] });
      expect(res.status).toBe(200);
      expect(res.body.cookbook.recipes.map((r: any) => r._id)).toEqual(["b", "a"]);
    });
  });

  describe("DELETE /api/cookbook/:cookbookId/recipes/:recipeId", () => {
    const path = "/api/cookbook/cb1/recipes/r1";

    it("400 → missing userId", async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const res = await request(app).delete(path);
      expect(res.status).toBe(400);
    });

    it("404 → cookbook missing", async () => {
      (cookbookModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).delete(path);
      expect(res.status).toBe(404);
    });

    it("200 → removes recipe and emits stats", async () => {
      const rec = { _id: "r1", title: "X" };
      const saveMock = jest.fn();
      (cookbookModel.findById as jest.Mock).mockResolvedValue({ recipes: [rec], save: saveMock });
      (getUserStatsForSocket as jest.Mock).mockResolvedValue({ foo: 1 });

      const res = await request(app).delete(path);
      expect(res.status).toBe(200);
      expect(saveMock).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith("user123");
    });
  });
});
