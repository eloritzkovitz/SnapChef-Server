import { Request, Response } from "express";
import {
  generateRecipe,
  generateRecipeImage,
} from "../src/modules/recipes/recipeController";

jest.mock("../src/modules/recipes/recipeGeneration", () => ({
  createRecipe: jest.fn(),
}));
jest.mock("../src/modules/recipes/recipeParser", () => ({
  parseRecipeString: jest.fn(),
}));
jest.mock("../src/modules/recipes/imageGeneration", () => ({
  generateImageForRecipe: jest.fn(),
}));
jest.mock("../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../src/utils/requestHelpers", () => ({
  getUserId: jest.fn(),
}));

import { createRecipe } from "../src/modules/recipes/recipeGeneration";
import { parseRecipeString } from "../src/modules/recipes/recipeParser";
import { generateImageForRecipe } from "../src/modules/recipes/imageGeneration";
import { getUserId } from "../src/utils/requestHelpers";

const mockRes = (): jest.Mocked<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Response>;
};

beforeEach(() => {
  jest.clearAllMocks();
});

/* ===========================================================
 *                      generateRecipe
 * ===========================================================
 */
describe("generateRecipe", () => {
  it("returns 401 when user is not authenticated", async () => {
    (getUserId as jest.Mock).mockReturnValue(undefined);

    const req = { body: { ingredients: "tomato" } } as unknown as Request;
    const res = mockRes();

    await generateRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authentication required.",
    });
  });

  it("returns 400 when ingredients are missing", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");

    const req = { body: { ingredients: "" } } as unknown as Request;
    const res = mockRes();

    await generateRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Ingredients are required.",
    });
  });

  it("returns recipe and image when successful", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");
    (createRecipe as jest.Mock).mockResolvedValue("Some recipe text");
    (parseRecipeString as jest.Mock).mockReturnValue({ title: "Pizza" });
    (generateImageForRecipe as jest.Mock).mockResolvedValue("http://img");

    const req = {
      body: { ingredients: ["tomato", "cheese"], servings: 2 },
    } as unknown as Request;
    const res = mockRes();

    await generateRecipe(req, res);

    expect(createRecipe).toHaveBeenCalledWith("tomato, cheese", {
      servings: 2,
    });
    expect(parseRecipeString).toHaveBeenCalledWith("Some recipe text");
    expect(generateImageForRecipe).toHaveBeenCalledWith({ title: "Pizza" });
    expect(res.json).toHaveBeenCalledWith({
      recipe: { title: "Pizza" },
      imageUrl: "http://img",
    });
  });

  it("falls back to placeholder image when image generation fails", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");
    (createRecipe as jest.Mock).mockResolvedValue("Text");
    (parseRecipeString as jest.Mock).mockReturnValue({ title: "Shakshuka" });
    (generateImageForRecipe as jest.Mock).mockRejectedValue(new Error("fail"));

    const req = { body: { ingredients: "eggs" } } as unknown as Request;
    const res = mockRes();

    await generateRecipe(req, res);

    expect(res.json).toHaveBeenCalledWith({
      recipe: { title: "Shakshuka" },
      imageUrl: "https://via.placeholder.com/400x300?text=No+Image",
    });
  });

  it("returns 500 when createRecipe throws", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");
    (createRecipe as jest.Mock).mockRejectedValue(new Error("GPT down"));

    const req = { body: { ingredients: "salt" } } as unknown as Request;
    const res = mockRes();

    await generateRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "GPT down" });
  });
});

/* ===========================================================
 *                  generateRecipeImage
 * ===========================================================
 */
describe("generateRecipeImage", () => {
  it("returns 401 when user is not authenticated", async () => {
    (getUserId as jest.Mock).mockReturnValue(null);

    const req = { body: { title: "Salad" } } as unknown as Request;
    const res = mockRes();

    await generateRecipeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authentication required.",
    });
  });

  it("returns 400 when title is missing", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");

    const req = { body: { ingredients: ["a", "b"] } } as unknown as Request;
    const res = mockRes();

    await generateRecipeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Recipe title is required",
    });
  });

  it("returns image URL when successful", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");
    (generateImageForRecipe as jest.Mock).mockResolvedValue("http://img2");

    const req = {
      body: { title: "Soup", ingredients: ["water"] },
    } as unknown as Request;
    const res = mockRes();

    await generateRecipeImage(req, res);

    expect(generateImageForRecipe).toHaveBeenCalledWith({
      title: "Soup",
      ingredients: ["water"],
    });
    expect(res.json).toHaveBeenCalledWith({ imageUrl: "http://img2" });
  });

  it("returns 500 when image URL is empty", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");
    (generateImageForRecipe as jest.Mock).mockResolvedValue("");

    const req = { body: { title: "Bread" } } as unknown as Request;
    const res = mockRes();

    await generateRecipeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to generate image",
    });
  });

  it("returns 500 when generateImageForRecipe throws", async () => {
    (getUserId as jest.Mock).mockReturnValue("u1");
    (generateImageForRecipe as jest.Mock).mockRejectedValue(new Error("boom"));

    const req = { body: { title: "Cake" } } as unknown as Request;
    const res = mockRes();

    await generateRecipeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "boom" });
  });
});
