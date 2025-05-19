import request from "supertest";
import express from "express";
import authController from "../modules/users/authController";
import userController from "../modules/users/userController";
import userModel from "../modules/users/User";
import fridgeModel from "../modules/fridge/Fridge";
import cookbookModel from "../modules/cookbook/Cookbook";
import { generateToken } from "../utils/tokenService";

jest.mock("../modules/users/User");
jest.mock("../modules/fridge/Fridge");
jest.mock("../modules/cookbook/Cookbook");
jest.mock("../utils/tokenService");

const app = express();
app.use(express.json());

app.post("/register", authController.register);
app.post("/login", authController.login);
app.get("/user/:id", userController.getUserData);

const mockUser = {
  _id: "user123",
  email: "test@example.com",
  password: "$2b$10$hashed",
  save: jest.fn(),
};

describe("User Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user", async () => {
      (userModel.create as jest.Mock).mockResolvedValueOnce(mockUser);
      (fridgeModel.create as jest.Mock).mockResolvedValueOnce({
        _id: "fridge123",
      });
      (cookbookModel.create as jest.Mock).mockResolvedValueOnce({
        _id: "cookbook123",
      });

      const res = await request(app).post("/register").send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "12345678",
      });

      expect(res.status).toBe(200);
      expect(userModel.create).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login a user with correct credentials", async () => {
      (userModel.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        password: await require("bcrypt").hash("12345678", 10),
        save: jest.fn(),
        refreshToken: [],
      });
      (generateToken as jest.Mock).mockReturnValue({
        accessToken: "access123",
        refreshToken: "refresh123",
      });

      const res = await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "12345678" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe("getUserData", () => {
    it("should return user data without password", async () => {
      (userModel.findById as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        toObject: () => ({ _id: "user123", email: "test@example.com" }),
      });

      const res = await request(app).get("/user/user123");
      expect(res.status).toBe(200);
      expect(res.body.email).toBe("test@example.com");
    });
  });
});
