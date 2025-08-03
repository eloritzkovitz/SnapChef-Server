import express from "express";
import request from "supertest";
import multer from "multer";
import fs from "fs/promises";
import recognitionController from "../src/modules/ingredients/recognitionController";
import * as imageRecognition from "../src/modules/ingredients/imageRecognition";
import * as requestHelpers from "../src/utils/requestHelpers";

jest.mock("fs/promises");
jest.mock("../src/utils/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));
jest.mock("../src/modules/ingredients/imageRecognition", () => ({
    recognizePhoto: jest.fn(),
    recognizeReceipt: jest.fn(),
    recognizeBarcode: jest.fn(),
}));
jest.mock("../src/utils/requestHelpers", () => ({
    getUserId: jest.fn(() => "mock-user"),
}));

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.post("/recognize/:type", upload.single("file"), (req, res) => {
    recognitionController.recognize(req, res, req.params.type);
});

describe("recognitionController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return recognized photo", async () => {
        const mockBuffer = Buffer.from("dummy");
        const filePath = "mock/photo.jpg";
        (fs.unlink as jest.Mock).mockResolvedValue(undefined);
        (imageRecognition.recognizePhoto as jest.Mock).mockResolvedValue(["tomato", "onion"]);

        const res = await request(app)
            .post("/recognize/photo")
            .attach("file", mockBuffer, { filename: filePath });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(["tomato", "onion"]);
    });

    it("should return recognized receipt", async () => {
        const mockBuffer = Buffer.from("receipt");
        const filePath = "mock/receipt.jpg";
        (fs.unlink as jest.Mock).mockResolvedValue(undefined);
        (imageRecognition.recognizeReceipt as jest.Mock).mockResolvedValue(["milk", "bread"]);

        const res = await request(app)
            .post("/recognize/receipt")
            .attach("file", mockBuffer, { filename: filePath });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(["milk", "bread"]);
    });

    it("should return barcode result", async () => {
        (imageRecognition.recognizeBarcode as jest.Mock).mockResolvedValue(["cereal", "milk"]);

        const res = await request(app)
            .post("/recognize/barcode")
            .send({ barcode: "12345678" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(["cereal", "milk"]);
    });

    it("should handle missing barcode", async () => {
        const res = await request(app).post("/recognize/barcode").send({});

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "No barcode provided." });
    });

    it("should handle missing file", async () => {
        const res = await request(app).post("/recognize/photo");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "No file uploaded." });
    });

    it("should return 400 for invalid type", async () => {
        const mockBuffer = Buffer.from("file");

        const res = await request(app)
            .post("/recognize/invalid")
            .attach("file", mockBuffer, { filename: "somefile.jpg" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid recognition type." });
    });

    it("should handle internal errors", async () => {
        (imageRecognition.recognizePhoto as jest.Mock).mockRejectedValue(new Error("fail"));
        const mockBuffer = Buffer.from("badfile");

        const res = await request(app)
            .post("/recognize/photo")
            .attach("file", mockBuffer, { filename: "fail.jpg" });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error");
    });
});
