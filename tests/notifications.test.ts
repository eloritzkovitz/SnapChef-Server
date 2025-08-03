import request from "supertest";
import express from "express";
import notificationController from "../src/modules/notifications/notificationController";
import Notification from "../src/modules/notifications/Notification";
import * as firebaseAdmin from "firebase-admin";
import { getUserId } from "../src/utils/requestHelpers";
import { io } from "../src/server";

jest.mock("../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../src/modules/notifications/Notification");
jest.mock("../src/utils/requestHelpers", () => ({
  getUserId: jest.fn(() => "mock-user"),
}));
jest.mock("firebase-admin", () => ({
  messaging: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue("mock-success"),
  }),
}));
jest.mock("../src/server", () => ({
  io: {
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  },
}));

const app = express();
app.use(express.json());
app.get("/notifications", notificationController.getNotifications);
app.post("/notifications", notificationController.createNotification);
app.put("/notifications/:id", notificationController.updateNotification);
app.delete("/notifications/:id", notificationController.deleteNotification);

describe("notificationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch notifications for a user", async () => {
    (Notification.find as jest.Mock).mockReturnValueOnce({
      sort: jest.fn().mockResolvedValue([{ id: "1" }]),
    });
    const res = await request(app).get("/notifications");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "1" }]);
  });

  it("should create a notification without push", async () => {
    (Notification.create as jest.Mock).mockResolvedValue({
      id: "1",
      recipientId: "user2",
    });
    const res = await request(app).post("/notifications").send({
      recipientId: "user2",
      type: "alert",
      title: "Test",
      body: "Body",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("should create a notification with push", async () => {
    (Notification.create as jest.Mock).mockResolvedValue({
      id: "1",
      recipientId: "user2",
    });
    const res = await request(app).post("/notifications").send({
      recipientId: "user2",
      type: "alert",
      title: "Test",
      body: "Body",
      deviceToken: "abc",
    });
    expect(res.status).toBe(201);
  });

  it("should fail to create notification without recipientId", async () => {
    const res = await request(app).post("/notifications").send({
      type: "alert",
      title: "Test",
      body: "Body",
    });
    expect(res.status).toBe(400);
  });

  it("should fail to create expiry notification without required fields", async () => {
    const res = await request(app).post("/notifications").send({
      recipientId: "user2",
      type: "expiry",
      title: "Test",
      body: "Body",
    });
    expect(res.status).toBe(400);
  });

  it("should update a notification", async () => {
    (Notification.findOneAndUpdate as jest.Mock).mockResolvedValue({
      id: "1",
    });
    const res = await request(app).put("/notifications/1").send({
      type: "alert",
      title: "Updated",
      body: "Updated body",
    });
    expect(res.status).toBe(200);
  });

  it("should fail to update non-existent notification", async () => {
    (Notification.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    const res = await request(app).put("/notifications/1").send({
      type: "alert",
      title: "Updated",
      body: "Updated body",
    });
    expect(res.status).toBe(404);
  });

  it("should fail to update expiry notification without required fields", async () => {
    const res = await request(app).put("/notifications/1").send({
      type: "expiry",
      title: "Updated",
      body: "Updated body",
    });
    expect(res.status).toBe(400);
  });

  it("should delete a notification", async () => {
    (Notification.findOneAndDelete as jest.Mock).mockResolvedValue({ id: "1" });
    const res = await request(app).delete("/notifications/1");
    expect(res.status).toBe(204);
  });

  it("should fail to delete non-existent notification", async () => {
    (Notification.findOneAndDelete as jest.Mock).mockResolvedValue(null);
    const res = await request(app).delete("/notifications/1");
    expect(res.status).toBe(404);
  });
});
it("should return 500 if getNotifications throws error", async () => {
  (Notification.find as jest.Mock).mockImplementation(() => {
    throw new Error("DB error");
  });
  const res = await request(app).get("/notifications");
  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty("message");
});

it("should return 500 if createNotification throws error", async () => {
  (Notification.create as jest.Mock).mockImplementation(() => {
    throw new Error("Creation failed");
  });
  const res = await request(app).post("/notifications").send({
    recipientId: "user2",
    type: "alert",
    title: "test",
    body: "body",
  });
  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty("message");
});

it("should return 500 if updateNotification throws error", async () => {
  (Notification.findOneAndUpdate as jest.Mock).mockImplementation(() => {
    throw new Error("Update failed");
  });
  const res = await request(app).put("/notifications/1").send({
    type: "alert",
    title: "test",
    body: "body",
  });
  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty("message");
});

it("should return 500 if deleteNotification throws error", async () => {
  (Notification.findOneAndDelete as jest.Mock).mockImplementation(() => {
    throw new Error("Delete failed");
  });
  const res = await request(app).delete("/notifications/1");
  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty("message");
});
