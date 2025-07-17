import express from "express";
import request from "supertest";
import fridgeController from "../modules/fridge/fridgeController";
import fridgeModel from "../modules/fridge/Fridge";


jest.mock("../modules/fridge/Fridge");
jest.mock("../utils/logService");

const app = express();
app.use(express.json());

app.post("/fridges", fridgeController.createFridge);
app.get("/fridges/:id", fridgeController.getFridgeContent);
app.post("/fridges/:fridgeId/items", fridgeController.addFridgeItem);
app.put("/fridges/:id/items/:itemId", fridgeController.updateFridgeItem);
app.delete("/fridges/:id/items/:itemId", fridgeController.deleteFridgeItem);

const mockSave = jest.fn();
const mockFridge = {
  _id: "fridge123",
  ownerId: "user123",
  ingredients: [],
  save: mockSave,
  markModified: jest.fn(),
};

jest.setTimeout(10000);

describe("Fridge Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    //(logActivity as jest.Mock).mockResolvedValue(undefined);
  });

  it("should create a fridge", async () => {
    (fridgeModel.create as jest.Mock).mockResolvedValue(mockFridge);

    const res = await request(app).post("/fridges").send({ userId: "user123" });

    expect(res.status).toBe(201);
    expect(fridgeModel.create).toHaveBeenCalledWith({ ownerId: "user123", ingredients: [] });
    //expect(logActivity).toHaveBeenCalled();
  });

  it("should return 400 if userId is missing", async () => {
    const res = await request(app).post("/fridges").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User ID is required");
  });

  it("should return fridge ingredients", async () => {
    (fridgeModel.findById as jest.Mock).mockResolvedValue({
      ...mockFridge,
      ingredients: [{ id: "i1", name: "Tomato" }],
    });

    const res = await request(app).get("/fridges/fridge123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "i1", name: "Tomato" }]);
  });

  it("should return 404 if fridge not found", async () => {
    (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/fridges/fridge123");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Fridge not found");
  });

  it("should add an item to fridge", async () => {
    const fridgeWithOwner = {
      ...mockFridge,
      ingredients: [],
      save: mockSave,
    };

    (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithOwner);

    const res = await request(app)
      .post("/fridges/fridge123/items")
      .send({ id: "i1", name: "Tomato", category: "veg", quantity: 2 });

    expect(res.status).toBe(201);
    expect(fridgeWithOwner.ingredients).toHaveLength(1);
    //expect(logActivity).toHaveBeenCalled();
  });

  it("should return 400 if item already exists", async () => {
    const fridgeWithItem = {
      ...mockFridge,
      ingredients: [{ id: "i1", name: "Tomato" }],
      save: mockSave,
    };

    (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItem);

    const res = await request(app)
      .post("/fridges/fridge123/items")
      .send({ id: "i1", name: "Tomato", category: "veg", quantity: 2 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Ingredient already exists in the fridge");
  });

  it("should update item quantity", async () => {
    const fridgeWithItem = {
      ...mockFridge,
      ingredients: [{ id: "i1", name: "Tomato", quantity: 1 }],
      markModified: jest.fn(),
      save: mockSave,
    };

    (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItem);

    const res = await request(app)
      .put("/fridges/fridge123/items/i1")
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(fridgeWithItem.ingredients[0].quantity).toBe(3);
    //expect(logActivity).toHaveBeenCalled();
  });

  it("should return 404 if item not found", async () => {
    const fridgeWithItem = {
      ...mockFridge,
      ingredients: [],
    };

    (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItem);

    const res = await request(app)
      .put("/fridges/fridge123/items/i1")
      .send({ quantity: 3 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Ingredient not found in this fridge");
  });

  it("should delete item from fridge", async () => {
    const fridgeWithItem = {
      ...mockFridge,
      ingredients: [{ id: "i1", name: "Tomato" }],
      save: mockSave,
    };

    (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItem);

    const res = await request(app).delete("/fridges/fridge123/items/i1");

    expect(res.status).toBe(200);
    //expect(logActivity).toHaveBeenCalled();
  });

  it("should return 404 if item not found when deleting", async () => {
    const fridgeWithItem = {
      ...mockFridge,
      ingredients: [],
    };

    (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItem);

    const res = await request(app).delete("/fridges/fridge123/items/i1");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Ingredient not found in this fridge");
  });
});
