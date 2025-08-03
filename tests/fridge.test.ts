import { Request, Response } from "express";
import fridgeController from "../src/modules/fridge/fridgeController";
import fridgeModel from "../src/modules/fridge/Fridge";
import { getUserId } from "../src/utils/requestHelpers";
import logger from "../src/utils/logger";
import { io } from "../src/server";
import { getUserStatsForSocket } from "../src/modules/users/userUtils";

jest.mock("../modules/fridge/Fridge");
jest.mock("../utils/requestHelpers");
jest.mock("../utils/logger");
jest.mock("../modules/users/userUtils");
jest.mock("../server", () => ({
  io: {
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
}));

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("fridgeController – full coverage", () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = makeRes();
    jest.clearAllMocks();
    (getUserId as jest.Mock).mockReturnValue("user-1"); // ברירת מחדל: יש user
    (getUserStatsForSocket as jest.Mock).mockResolvedValue({ some: "stats" });
  });

  // -------------------------
  // createFridge
  // -------------------------
  describe("createFridge", () => {
    it("201 when userId is present", async () => {
      const created = { _id: "f1", ownerId: "user-1", ingredients: [], groceries: [] };
      (fridgeModel.create as jest.Mock).mockResolvedValue(created);

      await fridgeController.createFridge(req as Request, res);

      expect(fridgeModel.create).toHaveBeenCalledWith({
        ownerId: "user-1",
        ingredients: [],
        groceries: [],
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    it("400 when userId is missing", async () => {
      (getUserId as jest.Mock).mockReturnValue(undefined);

      await fridgeController.createFridge(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User ID is required" });
    });

    it("500 on model error", async () => {
      (fridgeModel.create as jest.Mock).mockRejectedValue(new Error("DB error"));

      await fridgeController.createFridge(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error creating fridge" }));
    });
  });

  // -------------------------
  // getFridgeContent
  // -------------------------
  describe("getFridgeContent", () => {
    it("200 and returns ingredients", async () => {
      req.params = { fridgeId: "f1" };
      (fridgeModel.findById as jest.Mock).mockResolvedValue({ ingredients: [{ id: "i1" }] });

      await fridgeController.getFridgeContent(req as Request, res);

      expect(fridgeModel.findById).toHaveBeenCalledWith("f1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: "i1" }]);
    });

    it("404 when fridge not found", async () => {
      req.params = { fridgeId: "f404" };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

      await fridgeController.getFridgeContent(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge not found" });
    });

    it("500 on error", async () => {
      req.params = { fridgeId: "f1" };
      (fridgeModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

      await fridgeController.getFridgeContent(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error fetching fridge content" }));
    });
  });

  // -------------------------
  // addFridgeItem
  // -------------------------
  describe("addFridgeItem", () => {
    it("400 when userId missing", async () => {
      (getUserId as jest.Mock).mockReturnValue(null);

      await fridgeController.addFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User ID is required" });
    });

    it("400 when fridgeId missing", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = {}; // no fridgeId

      await fridgeController.addFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge ID is required" });
    });

    it("400 when required fields missing", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1" };
      req.body = { id: "i1", name: "Tomato" }; // missing category, quantity

      await fridgeController.addFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "ID, name, category, and quantity are required",
      });
    });

    it("404 when fridge not found", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f404" };
      req.body = { id: "i1", name: "Tomato", category: "veg", quantity: 2 };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

      await fridgeController.addFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge not found" });
    });

    it("400 when ingredient already exists", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1" };
      req.body = { id: "i1", name: "Tomato", category: "veg", quantity: 1 };
      const fridge = { ingredients: [{ id: "i1" }] };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(fridge);

      await fridgeController.addFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ingredient already exists in the fridge",
      });
    });

    it("201 success + emits when stats returned", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1" };
      req.body = { id: "i2", name: "Cucumber", category: "veg", quantity: 3, imageURL: "url" };
      const save = jest.fn();
      const fridge: any = { ingredients: [], save };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(fridge);
      (getUserStatsForSocket as jest.Mock).mockResolvedValue({ stat: 1 });

      await fridgeController.addFridgeItem(req as Request, res);

      expect(save).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Ingredient added successfully" })
      );
    });

    it("201 success + does not emit when stats null", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1" };
      req.body = { id: "i3", name: "Pepper", category: "veg", quantity: 1 };
      const save = jest.fn();
      const fridge: any = { ingredients: [], save };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(fridge);
      (getUserStatsForSocket as jest.Mock).mockResolvedValue(null);

      await fridgeController.addFridgeItem(req as Request, res);

      expect(save).toHaveBeenCalled();
      expect(io.to).not.toHaveBeenCalled(); // לא אמור לשדר
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("500 on error", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1" };
      req.body = { id: "i1", name: "Tomato", category: "veg", quantity: 2 };
      (fridgeModel.findById as jest.Mock).mockRejectedValue(new Error("DB err"));

      await fridgeController.addFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error adding item to fridge" })
      );
    });
  });

  // -------------------------
  // updateFridgeItem
  // -------------------------
  describe("updateFridgeItem", () => {
    it("400 when userId missing", async () => {
      (getUserId as jest.Mock).mockReturnValue(undefined);

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User ID is required" });
    });

    it("400 when fridgeId missing", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { itemId: "i1" };

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge ID is required" });
    });

    it("400 when quantity invalid (undefined/NaN)", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = {}; // quantity missing

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Valid quantity is required" });

      // NaN
      req.body = { quantity: "abc" as any };
      await fridgeController.updateFridgeItem(req as Request, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 when fridge not found", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f404", itemId: "i1" };
      req.body = { quantity: 3 };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge not found" });
    });

    it("404 when ingredient not found", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "iX" };
      req.body = { quantity: 3 };
      (fridgeModel.findById as jest.Mock).mockResolvedValue({ ingredients: [] });

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient not found in this fridge" });
    });

    it("200 success + markModified + emit stats", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = { quantity: 5 };
      const markModified = jest.fn();
      const save = jest.fn();
      const fridge = { ingredients: [{ id: "i1", quantity: 1 }], markModified, save };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(fridge);
      (getUserStatsForSocket as jest.Mock).mockResolvedValue({ ok: true });

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(fridge.ingredients[0].quantity).toBe(5);
      expect(markModified).toHaveBeenCalledWith("ingredients");
      expect(save).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Ingredient updated successfully" })
      );
    });

    it("500 on error", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = { quantity: 5 };
      (fridgeModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

      await fridgeController.updateFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error updating item" })
      );
    });
  });

  // -------------------------
  // updateFridgeItemImage
  // -------------------------
  describe("updateFridgeItemImage", () => {
    it("400 when imageURL missing", async () => {
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = {}; // no imageURL

      await fridgeController.updateFridgeItemImage(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "imageURL is required" });
    });

    it("404 when findOneAndUpdate returns null", async () => {
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = { imageURL: "http://img" };
      (fridgeModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await fridgeController.updateFridgeItemImage(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge or ingredient not found" });
    });

    it("200 success", async () => {
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = { imageURL: "http://img" };
      (fridgeModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ingredients: [{ id: "i1", imageURL: "http://img" }],
      });

      await fridgeController.updateFridgeItemImage(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Ingredient image updated successfully" })
      );
    });

    it("500 on error", async () => {
      req.params = { fridgeId: "f1", itemId: "i1" };
      req.body = { imageURL: "http://img" };
      (fridgeModel.findOneAndUpdate as jest.Mock).mockRejectedValue(new Error("DB error"));

      await fridgeController.updateFridgeItemImage(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error updating ingredient image" })
      );
    });
  });

  // -------------------------
  // reorderFridgeItems
  // -------------------------
  describe("reorderFridgeItems", () => {
    it("400 when orderedItemIds invalid (not array)", async () => {
      req.params = { fridgeId: "f1" };
      req.body = { orderedItemIds: "not-array" };

      await fridgeController.reorderFridgeItems(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "orderedItemIds must be a non-empty array",
      });
    });

    it("400 when orderedItemIds empty", async () => {
      req.params = { fridgeId: "f1" };
      req.body = { orderedItemIds: [] };

      await fridgeController.reorderFridgeItems(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 when fridge not found", async () => {
      req.params = { fridgeId: "f404" };
      req.body = { orderedItemIds: ["b", "a"] };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

      await fridgeController.reorderFridgeItems(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge not found" });
    });

    it("200 success", async () => {
      req.params = { fridgeId: "f1" };
      req.body = { orderedItemIds: ["b", "a"] };
      const save = jest.fn();
      const a = { id: "a" };
      const b = { id: "b" };
      const fridge = { ingredients: [a, b], save };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(fridge);

      await fridgeController.reorderFridgeItems(req as Request, res);

      expect(fridge.ingredients.map((x: any) => x.id)).toEqual(["b", "a"]);
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Fridge items reordered" })
      );
    });

    it("500 on error", async () => {
      req.params = { fridgeId: "f1" };
      req.body = { orderedItemIds: ["a"] };
      (fridgeModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

      await fridgeController.reorderFridgeItems(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Failed to reorder fridge items" })
      );
    });
  });

  // -------------------------
  // deleteFridgeItem
  // -------------------------
  describe("deleteFridgeItem", () => {
    it("400 when userId missing", async () => {
      (getUserId as jest.Mock).mockReturnValue(null);

      await fridgeController.deleteFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User ID is required" });
    });

    it("404 when fridge not found", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f404", itemId: "i1" };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

      await fridgeController.deleteFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Fridge not found" });
    });

    it("404 when ingredient not in fridge", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "i404" };
      (fridgeModel.findById as jest.Mock).mockResolvedValue({ ingredients: [] });

      await fridgeController.deleteFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient not found in this fridge" });
    });

    it("200 success + emits when stats returned", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "i1" };
      const save = jest.fn();
      const fridge = { ingredients: [{ id: "i1" }], save };
      (fridgeModel.findById as jest.Mock).mockResolvedValue(fridge);
      (getUserStatsForSocket as jest.Mock).mockResolvedValue({ ok: true });

      await fridgeController.deleteFridgeItem(req as Request, res);

      expect(fridge.ingredients).toEqual([]);
      expect(save).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient deleted successfully" });
    });

    it("500 on error", async () => {
      (getUserId as jest.Mock).mockReturnValue("user-1");
      req.params = { fridgeId: "f1", itemId: "i1" };
      (fridgeModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

      await fridgeController.deleteFridgeItem(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error deleting item" })
      );
    });
  });
});
