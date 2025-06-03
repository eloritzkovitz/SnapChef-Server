import { Request, Response } from "express";
import userModel from "./User";
import FriendRequest from "./FriendRequest";
import logger from "../../utils/logger";
import { sendFcmHttpV1 } from "../../utils/firebaseMessaging";
import { getUserId } from "../../utils/requestHelpers";

// Get friends list for current user
const getFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await userModel
      .findById(userId)
      .populate("friends", "firstName lastName email profilePicture");
    res.json({ friends: user?.friends || [] });
  } catch (error) {
    logger.error("Error fetching friends: %o", error);
    res.status(500).json({ message: "Failed to fetch friends." });
  }
};

// Get pending friend requests for current user
const getFriendRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const requests = await FriendRequest.find({
      $or: [{ to: userId }, { from: userId }],
    }).populate("from", "firstName lastName email profilePicture");
    res.json({ requests });
  } catch (error) {
    logger.error("Error fetching friend requests: %o", error);
    res.status(500).json({ message: "Failed to fetch friend requests." });
  }
};

// Send a friend request
const sendFriendRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const from = getUserId(req);
    const to = req.params.id;

    if (from === to) {
      res
        .status(400)
        .json({ message: "Cannot send friend request to yourself." });
      return;
    }

    // Check if already friends
    const user = await userModel.findById(from);

    if (
      user &&
      Array.isArray(user.friends) &&
      user.friends.map((f: any) => f.toString()).includes(to.toString())
    ) {
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

    // Send Firebase notification to recipient using HTTP v1 API
    try {
      const recipient = await userModel.findById(to);
      // Check notification preference before sending
      const friendRequestsEnabled =
        recipient?.preferences?.notificationPreferences?.friendRequests ?? true;
      if (recipient?.fcmToken && friendRequestsEnabled) {
        await sendFcmHttpV1({
          token: recipient.fcmToken,
          notification: {
            title: "New Friend Request",
            body: "You have a new friend request!",
          },
          data: {
            type: "FRIEND_REQUEST",
            fromUserId: from ? from.toString() : "",
            requestId: (
              request._id as string | { toString(): string }
            ).toString(),
          },
          android: {
            notification: {
              icon: "ic_notification",
              color: "#f47851",
            },
          },
          webpush: {
            notification: {
              icon: "ic_notification",
            },
          },
        });
      }
    } catch (notifyError) {
      logger.warn("Failed to send FCM notification: %o", notifyError);
    }

    res.status(201).json({ message: "Friend request sent.", request });
  } catch (error) {
    logger.error("Error sending friend request: %o", error);
    res.status(500).json({ message: "Failed to send friend request." });
  }
};

// Cancel a friend request (sender cancels their own pending request)
const cancelFriendRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      res.status(404).json({ message: "Friend request not found." });
      return;
    }
    if (!userId) {
      res.status(400).json({ message: "User ID is required." });
      return;
    }
    if (request.from.toString() !== userId.toString()) {
      res
        .status(403)
        .json({ message: "You can only cancel your own friend requests." });
      return;
    }
    if (request.status !== "pending") {
      res
        .status(400)
        .json({ message: "Only pending requests can be cancelled." });
      return;
    }

    await request.deleteOne();

    res.json({ message: "Friend request cancelled." });
  } catch (error) {
    logger.error("Error cancelling friend request: %o", error);
    res.status(500).json({ message: "Failed to cancel friend request." });
  }
};

// Accept a friend request
const acceptFriendRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!userId || !request || request.to.toString() !== userId.toString()) {
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

    // Send Firebase notification to sender
    try {
      const sender = await userModel.findById(request.from);
      // Check notification preference before sending
      const friendRequestsEnabled =
        sender?.preferences?.notificationPreferences?.friendRequests ?? true;
      if (sender?.fcmToken && friendRequestsEnabled) {
        await sendFcmHttpV1({
          token: sender.fcmToken,
          notification: {
            title: "Friend Request Accepted",
            body: "Your friend request was accepted!",
          },
          data: {
            type: "FRIEND_REQUEST_ACCEPTED",
            toUserId: userId ? userId.toString() : "",
            requestId: (
              request._id as string | { toString(): string }
            ).toString(),
          },
          android: {
            notification: {
              icon: "ic_notification",
              color: "#f47851",
            },
          },
          webpush: {
            notification: {
              icon: "ic_notification",
            },
          },
        });
      }
    } catch (notifyError) {
      logger.warn("Failed to send FCM notification: %o", notifyError);
    }

    res.json({ message: "Friend request accepted." });
  } catch (error) {
    logger.error("Error accepting friend request: %o", error);
    res.status(500).json({ message: "Failed to accept friend request." });
  }
};

// Decline a friend request
const declineFriendRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!userId || !request || request.to.toString() !== userId.toString()) {
      res.status(404).json({ message: "Friend request not found." });
      return;
    }
    if (request.status !== "pending") {
      res.status(400).json({ message: "Request already handled." });
      return;
    }

    request.status = "declined";
    await request.save();

    res.json({ message: "Friend request declined." });
  } catch (error) {
    logger.error("Error declining friend request: %o", error);
    res.status(500).json({ message: "Failed to decline friend request." });
  }
};

// Remove a friend
const removeFriend = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { friendId } = req.params;

    if (!friendId) {
      res.status(400).json({ message: "Friend ID is required." });
      return;
    }

    // Remove each user from the other's friends list
    await userModel.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });
    await userModel.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    logger.error("Error removing friend: %o", error);
    res.status(500).json({ message: "Failed to remove friend." });
  }
};

export default {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
};
