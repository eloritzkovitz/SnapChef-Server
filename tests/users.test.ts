import request from "supertest";
import express from "express";
import usersRouter from "../src/modules/users/userRoutes";
import * as requestHelpers from "../src/utils/requestHelpers";
import userModel from "../src/modules/users/User";
import fridgeModel from "../src/modules/fridge/Fridge";
import cookbookModel from "../src/modules/cookbook/Cookbook";
import { deleteFile } from "../src/utils/fileService";
import { getUserStatsForSocket } from "../src/modules/users/userUtils";
import bcrypt from "bcrypt";

jest.mock("../src/middlewares/auth", () => ({
  authenticate: (req: any, res: any, next: any) => next(),
}));
jest.mock("../src/utils/requestHelpers", () => ({
  getUserId: jest.fn(() => "user123"),
}));

jest.mock("../src/modules/users/User");
jest.mock("../src/modules/fridge/Fridge");
jest.mock("../src/modules/cookbook/Cookbook");
jest.mock("../src/utils/fileService");
jest.mock("../src/modules/users/userUtils");
jest.mock("bcrypt");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/users", usersRouter);

describe("Users Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- getUserData ---
  test("getUserData returns 200 and user data", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue({
      _id: "user123",
      email: "user@example.com",
      friends: [],
      toObject: () => ({ _id: "user123", email: "user@example.com" }),
    });

    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "user@example.com");
  });

  test("getUserData returns 404 if user not found", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(404);
  });

  test("getUserData returns 500 on error", async () => {
    (userModel.findById as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(500);
  });

  // --- updateUser ---
  test("updateUser updates firstName, lastName and password", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    (userModel.findById as jest.Mock).mockResolvedValue({
      firstName: "Old",
      lastName: "Name",
      password: "oldpass",
      profilePicture: "",
      save: saveMock,
      toObject: function () { return this; }
    });
    (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpass");

    const res = await request(app)
      .put("/api/users/me")
      .send({ firstName: "New", lastName: "User", password: "newpass" });

    expect(res.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
    expect(res.body.firstName).toBe("New");
    expect(res.body.lastName).toBe("User");
  });

  test("updateUser deletes old profile picture and updates with new one", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    (userModel.findById as jest.Mock).mockResolvedValue({
      profilePicture: "/uploads/oldpic.jpg",
      save: saveMock,
      toObject: function () { return this; }
    });
    (deleteFile as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .put("/api/users/me")
      .set('Content-Type', 'multipart/form-data')
      .attach('profilePicture', Buffer.from("dummy"), 'newpic.jpg');

    expect(res.status).toBe(200);
    expect(deleteFile).toHaveBeenCalled();
    expect(res.body).toHaveProperty("profilePicture");
  });

  test("updateUser returns 404 if user not found", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).put("/api/users/me").send({ firstName: "Test" });
    expect(res.status).toBe(404);
  });

  test("updateUser returns 500 on error", async () => {
    (userModel.findById as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).put("/api/users/me").send({ firstName: "Test" });
    expect(res.status).toBe(500);
  });

  // --- updatePreferences ---
  test("updatePreferences merges and saves preferences", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    (userModel.findById as jest.Mock).mockResolvedValue({
      preferences: {
        allergies: [],
        dietaryPreferences: {},
        notificationPreferences: {},
      },
      save: saveMock,
    });

    const preferences = {
      allergies: ["nuts"],
      dietaryPreferences: { vegan: true },
      notificationPreferences: { friendRequests: false },
    };

    const res = await request(app)
      .put("/api/users/me/preferences")
      .send(preferences);

    expect(res.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
    expect(res.body.preferences.allergies).toContain("nuts");
  });

  test("updatePreferences returns 404 if user not found", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).put("/api/users/me/preferences").send({});
    expect(res.status).toBe(404);
  });

  test("updatePreferences returns 500 on error", async () => {
    (userModel.findById as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).put("/api/users/me/preferences").send({});
    expect(res.status).toBe(500);
  });

  // --- updateFcmToken ---
  test("updateFcmToken updates token successfully", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    (userModel.findById as jest.Mock).mockResolvedValue({
      save: saveMock,
    });

    const res = await request(app).put("/api/users/me/fcm-token").send({
      fcmToken: "token123",
    });

    expect(res.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
  });

  test("updateFcmToken returns 400 if no token", async () => {
    const res = await request(app).put("/api/users/me/fcm-token").send({});
    expect(res.status).toBe(400);
  });

  test("updateFcmToken returns 404 if user not found", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).put("/api/users/me/fcm-token").send({
      fcmToken: "token123",
    });
    expect(res.status).toBe(404);
  });

  test("updateFcmToken returns 500 on error", async () => {
    (userModel.findById as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).put("/api/users/me/fcm-token").send({
      fcmToken: "token123",
    });
    expect(res.status).toBe(500);
  });

  // --- deleteUser ---
  test("deleteUser deletes user and related data", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue({
      profilePicture: "/uploads/pic.jpg",
      fridgeId: "fridge123",
      cookbookId: "cookbook123",
    });
    (deleteFile as jest.Mock).mockResolvedValue(true);
    (fridgeModel.findByIdAndDelete as jest.Mock).mockResolvedValue(true);
    (cookbookModel.findByIdAndDelete as jest.Mock).mockResolvedValue(true);
    (userModel.findByIdAndDelete as jest.Mock).mockResolvedValue(true);

    const res = await request(app).delete("/api/users/me");
    expect(res.status).toBe(200);
    expect(deleteFile).toHaveBeenCalled();
    expect(fridgeModel.findByIdAndDelete).toHaveBeenCalledWith("fridge123");
    expect(cookbookModel.findByIdAndDelete).toHaveBeenCalledWith("cookbook123");
    expect(userModel.findByIdAndDelete).toHaveBeenCalledWith("user123");
  });

  test("deleteUser returns 404 if user not found", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).delete("/api/users/me");
    expect(res.status).toBe(404);
  });

  test("deleteUser returns 500 on error", async () => {
    (userModel.findById as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).delete("/api/users/me");
    expect(res.status).toBe(500);
  });

  // --- findUsersByQuery ---
  test("findUsersByQuery returns 400 if no query param", async () => {
    const res = await request(app).get("/api/users").query({});
    expect(res.status).toBe(400);
  });

  test("findUsersByQuery returns matching users", async () => {
    (userModel.find as jest.Mock).mockResolvedValue([
      { _id: "user1", firstName: "Alice", lastName: "Smith", email: "alice@example.com", profilePicture: "" },
    ]);

    const res = await request(app).get("/api/users").query({ query: "Alice" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty("firstName", "Alice");
  });

  test("findUsersByQuery returns 500 on error", async () => {
    (userModel.find as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).get("/api/users").query({ query: "Alice" });
    expect(res.status).toBe(500);
  });

  // --- getUserProfile ---
  test("getUserProfile returns 404 for reserved ids", async () => {
    const reservedIds = ["friends", "me", "preferences", "fcm-token"];
    for (const id of reservedIds) {
      const res = await request(app).get(`/api/users/${id}`);
      expect(res.status).toBe(404);
    }
  });

  test("getUserProfile returns 200 and user data", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue({
      _id: "user123",
      firstName: "Test",
      lastName: "User",
      email: "user@example.com",
      profilePicture: "/uploads/pic.jpg",
      joinDate: new Date(),
    });

    const res = await request(app).get("/api/users/user123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "user@example.com");
  });

  test("getUserProfile returns 404 if user not found", async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get("/api/users/user123");
    expect(res.status).toBe(404);
  });

  test("getUserProfile returns 500 on error", async () => {
    (userModel.findById as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).get("/api/users/user123");
    expect(res.status).toBe(500);
  });

  // --- getUserStats ---
  test("getUserStats returns 200 and stats", async () => {
    (getUserStatsForSocket as jest.Mock).mockResolvedValue({
      ingredientCount: 10,
      recipeCount: 5,
      mostPopularIngredients: [],
      favoriteRecipeCount: 3,
      friendCount: 2,
    });
    const res = await request(app).get("/api/users/user123/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ingredientCount", 10);
  });

  test("getUserStats returns 404 if no stats found", async () => {
    (getUserStatsForSocket as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get("/api/users/user123/stats");
    expect(res.status).toBe(404);
  });

  test("getUserStats returns 500 on error", async () => {
    (getUserStatsForSocket as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await request(app).get("/api/users/user123/stats");
    expect(res.status).toBe(500);
  });
});
