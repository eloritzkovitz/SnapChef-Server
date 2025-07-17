import express, { Request, Response } from "express";
import request from "supertest";
import cookbookController from "../modules/cookbook/cookbookController";


const app = express();
app.use(express.json());

app.post("/cookbooks/:cookbookId/recipes", cookbookController.addRecipe);
app.put("/cookbooks/:cookbookId/recipes/:recipeId", cookbookController.updateRecipe);
app.delete("/cookbooks/:cookbookId/recipes/:recipeId", cookbookController.removeRecipe);
app.get("/cookbooks/:cookbookId", cookbookController.getCookbookContent);

jest.mock("../modules/cookbook/Cookbook", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

import cookbookModel from "../modules/cookbook/Cookbook";

const mockSave = jest.fn();
const mockCookbook = {
  _id: "cookbook123",
  recipes: [],
  save: mockSave,
};

jest.setTimeout(10000); 

describe("Cookbook Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined); 
  });

  it("should add a recipe to the cookbook", async () => {
    (cookbookModel.findById as jest.Mock).mockResolvedValue(mockCookbook);

    const res = await request(app)
      .post("/cookbooks/cookbook123/recipes")
      .send({ title: "Pizza", ingredients: ["cheese"] });

    expect(res.status).toBe(200);
    expect(mockSave).toHaveBeenCalled();
    expect(res.body.message).toBe("Recipe added to cookbook");
  });

  it("should return 404 if cookbook not found", async () => {
    (cookbookModel.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/cookbooks/cookbook123/recipes")
      .send({ title: "Pizza" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cookbook not found");
  });

  it("should update a recipe in the cookbook", async () => {
    const mockRecipe = { _id: "recipe123", title: "Old Recipe" };
    const updatedData = { title: "Updated Recipe" };

    const cookbookWithRecipe = {
      ...mockCookbook,
      recipes: [mockRecipe],
      save: mockSave,
    };

    (cookbookModel.findById as jest.Mock).mockResolvedValue(cookbookWithRecipe);

    const res = await request(app)
      .put("/cookbooks/cookbook123/recipes/recipe123")
      .send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Recipe updated in cookbook");
    expect(res.body.recipe.title).toBe("Updated Recipe");
    expect(mockSave).toHaveBeenCalled();
  });

  it("should remove a recipe from the cookbook", async () => {
    const cookbookWithRecipe = {
      ...mockCookbook,
      recipes: [
        { _id: "recipe123", title: "To Be Removed" },
        { _id: "recipe999", title: "Keep Me" },
      ],
      save: mockSave,
    };

    (cookbookModel.findById as jest.Mock).mockResolvedValue(cookbookWithRecipe);

    const res = await request(app)
      .delete("/cookbooks/cookbook123/recipes/recipe123");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Recipe removed from cookbook");
    expect(cookbookWithRecipe.recipes).toHaveLength(1);
    expect(cookbookWithRecipe.recipes[0]._id).toBe("recipe999");
    expect(mockSave).toHaveBeenCalled();
  });

  it("should return cookbook content", async () => {
    (cookbookModel.findById as jest.Mock).mockResolvedValue(mockCookbook);

    const res = await request(app).get("/cookbooks/cookbook123");

    expect(res.status).toBe(200);
    expect(res.body.cookbook._id).toBe("cookbook123");
  });

  it("should return 404 if recipe to update is not found", async () => {
    const cookbookWithRecipe = {
      ...mockCookbook,
      recipes: [{ _id: "some-other-id", title: "Not Target" }],
      save: mockSave,
    };

    (cookbookModel.findById as jest.Mock).mockResolvedValue(cookbookWithRecipe);

    const res = await request(app)
      .put("/cookbooks/cookbook123/recipes/recipe123")
      .send({ title: "Won't update" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Recipe not found in cookbook");
  });

  it("should handle error when adding a recipe (500)", async () => {
    (cookbookModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/cookbooks/cookbook123/recipes")
      .send({ title: "Fail" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to add recipe to cookbook");
    expect(res.body.error).toBe("DB error");
  });

  it("should handle error when updating a recipe (500)", async () => {
    (cookbookModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/cookbooks/cookbook123/recipes/recipe123")
      .send({ title: "Should fail" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to update recipe in cookbook");
  });

  it("should handle error when removing a recipe (500)", async () => {
    (cookbookModel.findById as jest.Mock).mockRejectedValue(new Error("Remove fail"));

    const res = await request(app)
      .delete("/cookbooks/cookbook123/recipes/recipe123");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to remove recipe from cookbook");
    expect(res.body.error).toBe("Remove fail");
  });

  it("should handle error when fetching cookbook content (500)", async () => {
    (cookbookModel.findById as jest.Mock).mockRejectedValue(new Error("Fetch fail"));

    const res = await request(app).get("/cookbooks/cookbook123");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch cookbook");
    expect(res.body.error).toBe("Fetch fail");
  });


});