import { Request, Response } from "express";
import userModel from "./User";
import FriendRequest from "./FriendRequest";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";

// Send a friend request
const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = getUserId(req);
    const to = req.params.id;

    if (from === to) {
      res.status(400).json({ message: "Cannot send friend request to yourself." });
      return;
    }

    // Check if already friends
    const user = await userModel.findById(from);

    if (user?.friends.map((f) => f.toString()).includes(to)) {
      res.status(400).json({ message: "Already friends." });
      return;
    }

    // Check for existing pending request
    const existing = await FriendRequest.findOne({
      from,
      to,
      status: "pending",
    });
    if (existing) {
      res.status(400).json({ message: "Friend request already sent." });
      return;
    }

    const request = await FriendRequest.create({ from, to });
    // TODO: Send Firebase notification here

    res.status(201).json({ message: "Friend request sent.", request });
  } catch (error) {
    logger.error("Error sending friend request: %o", error);
    res.status(500).json({ message: "Failed to send friend request." });
  }
};

// Get pending friend requests for current user
const getFriendRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const requests = await FriendRequest.find({
      to: userId,
      status: "pending",
    }).populate("from", "username email");
    res.json({ requests });
  } catch (error) {
    logger.error("Error fetching friend requests: %o", error);
    res.status(500).json({ message: "Failed to fetch friend requests." });
  }
};

// Accept a friend request
const acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.to.toString() !== userId) {
      res.status(404).json({ message: "Friend request not found." });
      return;
    }
    if (request.status !== "pending") {
      res.status(400).json({ message: "Request already handled." });
      return;
    }

    // Add each user to the other's friends list
    await userModel.findByIdAndUpdate(request.from, {
      $addToSet: { friends: request.to },
    });
    await userModel.findByIdAndUpdate(request.to, {
      $addToSet: { friends: request.from },
    });

    request.status = "accepted";
    await request.save();

    // TODO: Send notification to sender

    res.json({ message: "Friend request accepted." });
  } catch (error) {
    logger.error("Error accepting friend request: %o", error);
    res.status(500).json({ message: "Failed to accept friend request." });
  }
};

// Decline a friend request
const declineFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.to.toString() !== userId) {
      res.status(404).json({ message: "Friend request not found." });
      return;
    }
    if (request.status !== "pending") {
      res.status(400).json({ message: "Request already handled." });
      return;
    }

    request.status = "declined";
    await request.save();

    // TODO: Send notification to sender

    res.json({ message: "Friend request declined." });
  } catch (error) {
    logger.error("Error declining friend request: %o", error);
    res.status(500).json({ message: "Failed to decline friend request." });
  }
};

// Get friends list for current user
const getFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await userModel
      .findById(userId)
      .populate("friends", "username email");
    res.json({ friends: user?.friends || [] });
  } catch (error) {
    logger.error("Error fetching friends: %o", error);
    res.status(500).json({ message: "Failed to fetch friends." });
  }
};

export default {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
};
