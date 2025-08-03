import express from "express";
import request from "supertest";
import groceriesController from "../src/modules/fridge/groceriesController";
import fridgeModel from "../src/modules/fridge/Fridge";

jest.mock("../src/modules/fridge/Fridge");
jest.mock("../src/utils/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));
jest.mock("../src/utils/requestHelpers", () => ({
    getUserId: () => "user123",
}));

const app = express();
app.use(express.json());

app.get("/fridges/:fridgeId/groceries", groceriesController.getGroceriesList);
app.post("/fridges/:fridgeId/groceries", groceriesController.addGroceryItem);
app.put("/fridges/:fridgeId/groceries/:itemId", groceriesController.updateGroceryItem);
app.put("/fridges/:fridgeId/groceries/:itemId/image", groceriesController.updateGroceryItemImage);
app.post("/fridges/:fridgeId/groceries/reorder", groceriesController.reorderGroceries);
app.delete("/fridges/:fridgeId/groceries/:itemId", groceriesController.deleteGroceryItem);

const mockSave = jest.fn();
const mockFridge = {
    _id: "fridge123",
    groceries: [],
    save: mockSave,
    markModified: jest.fn(),
};

describe("Groceries Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSave.mockResolvedValue(undefined);
    });

    it("should get groceries list", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue({
            ...mockFridge,
            groceries: [{ id: "1", name: "Apple" }],
        });

        const res = await request(app).get("/fridges/fridge123/groceries");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: "1", name: "Apple" }]);
    });

    it("should return 404 if fridge not found (get)", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

        const res = await request(app).get("/fridges/fridge123/groceries");
        expect(res.status).toBe(404);
    });

    it("should return 500 on error (get)", async () => {
        (fridgeModel.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

        const res = await request(app).get("/fridges/fridge123/groceries");
        expect(res.status).toBe(500);
    });

    it("should add grocery item", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue(mockFridge);

        const res = await request(app).post("/fridges/fridge123/groceries").send({
            id: "1",
            name: "Banana",
            category: "Fruit",
            quantity: 5,
        });

        expect(res.status).toBe(201);
        expect(mockFridge.groceries).toHaveLength(1);
    });

    it("should return 400 if missing fields", async () => {
        const res = await request(app).post("/fridges/fridge123/groceries").send({});
        expect(res.status).toBe(400);
    });

    it("should return 404 if fridge not found (add)", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue(null);
        const res = await request(app).post("/fridges/fridge123/groceries").send({
            id: "1",
            name: "Banana",
            category: "Fruit",
            quantity: 5,
        });
        expect(res.status).toBe(404);
    });

    it("should return 400 if item already exists", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue({
            ...mockFridge,
            groceries: [{ id: "1", name: "Banana" }],
        });

        const res = await request(app).post("/fridges/fridge123/groceries").send({
            id: "1",
            name: "Banana",
            category: "Fruit",
            quantity: 5,
        });

        expect(res.status).toBe(400);
    });

    it("should update grocery quantity", async () => {
        const fridgeWithItem = {
            ...mockFridge,
            groceries: [{ id: "1", quantity: 2 }],
        };

        (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItem);

        const res = await request(app).put("/fridges/fridge123/groceries/1").send({ quantity: 4 });
        expect(res.status).toBe(200);
        expect(fridgeWithItem.groceries[0].quantity).toBe(4);
    });

    it("should return 400 if quantity invalid", async () => {
        const res = await request(app).put("/fridges/fridge123/groceries/1").send({ quantity: null });
        expect(res.status).toBe(400);
    });

    it("should return 404 if fridge not found (update)", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue(null);
        const res = await request(app).put("/fridges/fridge123/groceries/1").send({ quantity: 3 });
        expect(res.status).toBe(404);
    });

    it("should return 404 if item not found (update)", async () => {
        const fridgeWithEmpty = { ...mockFridge, groceries: [] };
        (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithEmpty);

        const res = await request(app).put("/fridges/fridge123/groceries/1").send({ quantity: 3 });
        expect(res.status).toBe(404);
    });

    it("should update grocery image", async () => {
        const updatedFridge = {
            groceries: [{ id: "1", imageURL: "new.jpg" }],
        };

        (fridgeModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedFridge);

        const res = await request(app)
            .put("/fridges/fridge123/groceries/1/image")
            .send({ imageURL: "new.jpg" });

        expect(res.status).toBe(200);
        expect(res.body.ingredient.imageURL).toBe("new.jpg");
    });

    it("should return 400 if imageURL is missing", async () => {
        const res = await request(app).put("/fridges/fridge123/groceries/1/image").send({});
        expect(res.status).toBe(400);
    });

    it("should reorder groceries", async () => {
        const fridgeWithItems = {
            ...mockFridge,
            groceries: [
                { id: "1", name: "Apple" },
                { id: "2", name: "Banana" },
            ],
        };

        (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItems);

        const res = await request(app)
            .post("/fridges/fridge123/groceries/reorder")
            .send({ orderedItemIds: ["2", "1"] });

        expect(res.status).toBe(200);
        expect(fridgeWithItems.groceries[0].id).toBe("2");
    });

    it("should return 400 if orderedItemIds missing", async () => {
        const res = await request(app)
            .post("/fridges/fridge123/groceries/reorder")
            .send({ orderedItemIds: [] });

        expect(res.status).toBe(400);
    });

    it("should delete grocery item", async () => {
        const fridgeWithItems = {
            ...mockFridge,
            groceries: [{ id: "1", name: "Apple" }],
        };

        (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithItems);

        const res = await request(app).delete("/fridges/fridge123/groceries/1");
        expect(res.status).toBe(200);
    });

    it("should return 404 if fridge not found (delete)", async () => {
        (fridgeModel.findById as jest.Mock).mockResolvedValue(null);

        const res = await request(app).delete("/fridges/fridge123/groceries/1");
        expect(res.status).toBe(404);
    });

    it("should return 404 if item not found (delete)", async () => {
        const fridgeWithoutItem = { ...mockFridge, groceries: [] };
        (fridgeModel.findById as jest.Mock).mockResolvedValue(fridgeWithoutItem);

        const res = await request(app).delete("/fridges/fridge123/groceries/1");
        expect(res.status).toBe(404);
    });
});
