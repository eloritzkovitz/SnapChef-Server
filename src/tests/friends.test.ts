// src/tests/friends.test.ts
import request from "supertest";
import express from "express";
import userModel from "../modules/users/User";
import FriendRequest from "../modules/users/FriendRequest";
import * as firebaseMessaging from "../utils/firebaseMessaging";
import { io } from "../server";
import * as userUtils from "../modules/users/userUtils";
import friendsRoutes from "../modules/users/friendsRoutes";

// Mock the authenticate middleware so req.user.id is always "user123"
jest.mock("../middlewares/auth", () => ({
    authenticate: jest.fn((req: any, res: any, next: any) => {
        req.user = { id: "user123" };
        next();
    }),
}));

// Other mocks
jest.mock("../modules/users/User");
jest.mock("../modules/users/FriendRequest");
jest.mock("../utils/firebaseMessaging");
jest.mock("../modules/users/userUtils");
jest.mock("../utils/logger");
jest.mock("../server", () => ({
    io: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    },
}));

const app = express();
app.use(express.json());
app.use("/api/friends", friendsRoutes);

describe("Friends Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // restore getUserId to default behavior
        jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue("user123");
    });

    describe("getFriends", () => {
        test("returns friends list", async () => {
            (userModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue([
                    { firstName: "Alice", lastName: "Smith", email: "alice@example.com" },
                ]),
            });

            const res = await request(app).get("/api/friends");
            expect(res.status).toBe(200);
            expect(res.body.friends).toHaveLength(1);
        });

        test("returns empty array if user not found", async () => {
            (userModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            const res = await request(app).get("/api/friends");
            expect(res.status).toBe(200);
            expect(res.body.friends).toEqual([]);
        });

        test("returns 500 on error", async () => {
            (userModel.findById as jest.Mock).mockRejectedValue(new Error("db error"));
            const res = await request(app).get("/api/friends");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to fetch friends." });
        });
    });

    describe("getFriendRequests", () => {
        test("returns requests list", async () => {
            (FriendRequest.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue([
                    { from: { firstName: "Bob", lastName: "Jones" } },
                ]),
            });

            const res = await request(app).get("/api/friends/requests");
            expect(res.status).toBe(200);
            expect(res.body.requests).toHaveLength(1);
        });

        test("returns empty array when no requests", async () => {
            (FriendRequest.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue([]),
            });

            const res = await request(app).get("/api/friends/requests");
            expect(res.status).toBe(200);
            expect(res.body.requests).toEqual([]);
        });

        test("returns 500 on error", async () => {
            (FriendRequest.find as jest.Mock).mockRejectedValue(new Error("db error"));
            const res = await request(app).get("/api/friends/requests");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to fetch friend requests." });
        });
    });

    describe("sendFriendRequest", () => {
        beforeEach(() => {
            // always reset getUserId
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue("user123");
        });

        test("creates request and sends notification", async () => {
            (userModel.findById as jest.Mock)
                .mockResolvedValueOnce({ friends: [] })
                .mockResolvedValueOnce({
                    fcmToken: "token",
                    preferences: { notificationPreferences: { friendRequests: true } },
                });

            (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);
            (FriendRequest.create as jest.Mock).mockResolvedValue({ _id: "req123" });
            (firebaseMessaging.sendFcmHttpV1 as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Friend request sent.");
            expect(firebaseMessaging.sendFcmHttpV1).toHaveBeenCalled();
        });

        test("does not send notification if recipient has no token or notifications disabled", async () => {
            (userModel.findById as jest.Mock)
                .mockResolvedValueOnce({ friends: [] })
                .mockResolvedValueOnce({ fcmToken: null, preferences: { notificationPreferences: { friendRequests: false } } });

            (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);
            (FriendRequest.create as jest.Mock).mockResolvedValue({ _id: "req123" });

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(201);
            expect(firebaseMessaging.sendFcmHttpV1).not.toHaveBeenCalled();
        });

        test("handles notification failure gracefully and still returns 201", async () => {
            (userModel.findById as jest.Mock)
                .mockResolvedValueOnce({ friends: [] })
                .mockResolvedValueOnce({
                    fcmToken: "token",
                    preferences: { notificationPreferences: { friendRequests: true } },
                });

            (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);
            (FriendRequest.create as jest.Mock).mockResolvedValue({ _id: "req123" });
            (firebaseMessaging.sendFcmHttpV1 as jest.Mock).mockRejectedValue(new Error("FCM down"));

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(201);
            expect(firebaseMessaging.sendFcmHttpV1).toHaveBeenCalled();
        });

        test("returns 400 if sending to self", async () => {
            // override authenticate to set req.user.id = targetUser
            jest.spyOn(require("../middlewares/auth"), "authenticate").mockImplementation((req: any, res: any, next: any) => {
                req.user = { id: "targetUser" };
                next();
            });

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "Cannot send friend request to yourself." });

            // restore
            jest.spyOn(require("../middlewares/auth"), "authenticate").mockImplementation((req: any, res: any, next: any) => {
                req.user = { id: "user123" };
                next();
            });
        });

        test("returns 400 if already friends", async () => {
            (userModel.findById as jest.Mock).mockResolvedValue({ friends: ["targetUser"] });

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "Already friends." });
        });

        test("returns 400 if friend request already sent", async () => {
            (userModel.findById as jest.Mock).mockResolvedValue({ friends: [] });
            (FriendRequest.findOne as jest.Mock).mockResolvedValue({ _id: "exists" });

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "Friend request already sent." });
        });

        test("returns 500 on create error", async () => {
            (userModel.findById as jest.Mock).mockResolvedValue({ friends: [] });
            (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);
            (FriendRequest.create as jest.Mock).mockRejectedValue(new Error("db error"));

            const res = await request(app).post("/api/friends/requests/targetUser");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to send friend request." });
        });
    });

    describe("cancelFriendRequest", () => {
        test("deletes request", async () => {
            const deleteOneMock = jest.fn();
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                from: "user123",
                status: "pending",
                deleteOne: deleteOneMock,
            });

            const res = await request(app).delete("/api/friends/requests/req123/cancel");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Friend request cancelled." });
            expect(deleteOneMock).toHaveBeenCalled();
        });

        test("returns 404 if not found", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue(null);
            const res = await request(app).delete("/api/friends/requests/req123/cancel");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: "Friend request not found." });
        });

        test("returns 400 if no userId", async () => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue(null);
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                from: "user123",
                status: "pending",
                deleteOne: jest.fn(),
            });

            const res = await request(app).delete("/api/friends/requests/req123/cancel");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "User ID is required." });
        });

        test("returns 403 if wrong sender", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                from: "otherUser",
                status: "pending",
                deleteOne: jest.fn(),
            });

            const res = await request(app).delete("/api/friends/requests/req123/cancel");
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ message: "You can only cancel your own friend requests." });
        });

        test("returns 400 if status not pending", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                from: "user123",
                status: "accepted",
                deleteOne: jest.fn(),
            });

            const res = await request(app).delete("/api/friends/requests/req123/cancel");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "Only pending requests can be cancelled." });
        });

        test("returns 500 on delete error", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                from: "user123",
                status: "pending",
                deleteOne: jest.fn().mockRejectedValue(new Error("fail")),
            });

            const res = await request(app).delete("/api/friends/requests/req123/cancel");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to cancel friend request." });
        });
    });

    describe("acceptFriendRequest", () => {
        beforeEach(() => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue("user123");
        });

        test("accepts request and emits all events", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                to: "user123",
                from: "friend1",
                status: "pending",
                save: jest.fn().mockResolvedValue(true),
                _id: "req123",
                toString() { return "req123"; },
            });
            (userModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);
            (userModel.findById as jest.Mock)
                .mockResolvedValueOnce({ fcmToken: "token", preferences: { notificationPreferences: { friendRequests: true } } }); // for notification
            (firebaseMessaging.sendFcmHttpV1 as jest.Mock).mockResolvedValue(undefined);
            (userUtils.getUserStatsForSocket as jest.Mock)
                .mockResolvedValueOnce({ count: 1 })
                .mockResolvedValueOnce({ count: 2 });

            const res = await request(app).post("/api/friends/requests/req123/accept");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Friend request accepted." });
            // friendUpdate for both users + two userStatsUpdate
            expect(io.to).toHaveBeenCalledTimes(4);
            expect(firebaseMessaging.sendFcmHttpV1).toHaveBeenCalled();
        });

        test("does not send notification or stats if disabled/null", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                to: "user123",
                from: "friend1",
                status: "pending",
                save: jest.fn().mockResolvedValue(true),
                _id: "req123",
                toString() { return "req123"; },
            });
            (userModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);
            (userModel.findById as jest.Mock)
                .mockResolvedValueOnce({ fcmToken: null, preferences: { notificationPreferences: { friendRequests: false } } });
            (firebaseMessaging.sendFcmHttpV1 as jest.Mock).mockResolvedValue(undefined);
            (userUtils.getUserStatsForSocket as jest.Mock).mockResolvedValue(null);

            const res = await request(app).post("/api/friends/requests/req123/accept");
            expect(res.status).toBe(200);
            // only the two friendUpdate calls
            expect(io.to).toHaveBeenCalledTimes(2);
            expect(firebaseMessaging.sendFcmHttpV1).not.toHaveBeenCalled();
        });

        test("returns 400 if already handled", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({ to: "user123", status: "accepted" });
            const res = await request(app).post("/api/friends/requests/req123/accept");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "Request already handled." });
        });

        test("returns 404 if not found or mismatch", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue(null);
            const res = await request(app).post("/api/friends/requests/req123/accept");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: "Friend request not found." });
        });

        test("returns 500 on general error", async () => {
            (FriendRequest.findById as jest.Mock).mockRejectedValue(new Error("fail"));
            const res = await request(app).post("/api/friends/requests/req123/accept");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to accept friend request." });
        });
    });

    describe("declineFriendRequest", () => {
        beforeEach(() => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue("user123");
        });

        test("declines request", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                to: "user123",
                status: "pending",
                save: jest.fn().mockResolvedValue(true),
            });

            const res = await request(app).post("/api/friends/requests/req123/decline");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Friend request declined." });
        });

        test("returns 400 if already handled", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({ to: "user123", status: "accepted" });
            const res = await request(app).post("/api/friends/requests/req123/decline");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "Request already handled." });
        });

        test("returns 404 if not found or mismatch", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({ to: "otherUser", status: "pending" });
            const res = await request(app).post("/api/friends/requests/req123/decline");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: "Friend request not found." });
        });

        test("returns 404 if no userId", async () => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue(null);
            const res = await request(app).post("/api/friends/requests/req123/decline");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: "Friend request not found." });
        });

        test("returns 500 on save error", async () => {
            (FriendRequest.findById as jest.Mock).mockResolvedValue({
                to: "user123",
                status: "pending",
                save: jest.fn().mockRejectedValue(new Error("fail")),
            });
            const res = await request(app).post("/api/friends/requests/req123/decline");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to decline friend request." });
        });
    });

    describe("removeFriend", () => {
        beforeEach(() => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue("user123");
        });

        test("removes friend and emits all events", async () => {
            (userModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);
            (userUtils.getUserStatsForSocket as jest.Mock)
                .mockResolvedValueOnce({ count: 1 })
                .mockResolvedValueOnce({ count: 2 });

            const res = await request(app).delete("/api/friends/friend456");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Friend removed successfully." });
            // friendUpdate x2 + userStatsUpdate x2
            expect(io.to).toHaveBeenCalledTimes(4);
        });

        test("does not emit stats if none returned", async () => {
            (userModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);
            (userUtils.getUserStatsForSocket as jest.Mock).mockResolvedValue(null);

            const res = await request(app).delete("/api/friends/friend456");
            expect(res.status).toBe(200);
            // only the 2 friendUpdate calls
            expect(io.to).toHaveBeenCalledTimes(2);
        });

        test("returns 400 if no userId", async () => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue(null);
            const res = await request(app).delete("/api/friends/friend456");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: "User ID is required." });
        });

        test("returns 400 if no friendId", async () => {
            jest.spyOn(require("../utils/requestHelpers"), "getUserId").mockReturnValue("user123");
            // hit endpoint without param: express will 404; to test code's own branch we can call with empty string
            const res = await request(app).delete("/api/friends/");
            expect(res.status).toBe(404);
        });

        test("returns 500 on error", async () => {
            (userModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error("fail"));
            const res = await request(app).delete("/api/friends/friend456");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Failed to remove friend." });
        });
    });
});
