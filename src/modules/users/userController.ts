import { Request, Response } from "express";
import path from "path";
import bcrypt from "bcrypt";
import userModel from "./User";
import { Preferences } from "./Preferences";
import fridgeModel from "../fridge/Fridge";
import cookbookModel from "../cookbook/Cookbook";
import { deleteFile } from "../../utils/fileService";
import logger from "../../utils/logger";
import { getUserId } from "../../utils/requestHelpers";
import { getUserStatsForSocket } from "./userUtils";

// Get the authenticated user's data
const getUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedUserId = req.params.id;
    const authenticatedUserId = getUserId(req);

    // Use the requested ID if available, otherwise fallback to the authenticated user
    const userId = requestedUserId || authenticatedUserId;

    const user = await userModel
      .findById(userId)
      .select("-password")
      .populate("friends", "firstName lastName email profilePicture");

    if (!user) {
      logger.warn("User not found: %s", userId);
      res.status(404).json({ message: "User not found" });
      return;
    }

    logger.info("User data fetched for user: %s", userId);
    res.json(user);
  } catch (error) {
    logger.error("Error fetching user data: %o", error);
    res.status(500).json({ message: "Error fetching user data", error });
  }
};

interface UpdateUserRequestBody {
  firstName?: string;
  lastName?: string;
  password?: string;
  profilePicture?: string;
}

// Update user data
const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn("Attempted to update non-existent user: %s", userId);
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update user details
    if (req.body.firstName !== undefined) user.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) user.lastName = req.body.lastName;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update profile picture
    if (req.file || req.body.profilePicture === "") {
      // Check if the old profile picture needs to be deleted
      if (user.profilePicture && user.profilePicture !== "") {
        // Construct the absolute path to the file
        const filePath = path.join(
          process.cwd(),
          "uploads",
          path.basename(user.profilePicture)
        );
        logger.info(
          "Deleting old profile picture for user %s: %s",
          userId,
          filePath
        );
        await deleteFile(filePath);
      }

      // Update the profile picture based on the input
      if (req.file) {
        user.profilePicture = `/uploads/${req.file.filename}`; // Store relative path
      } else {
        user.profilePicture = ""; // Set to default image
      }
    }

    // Save the updated user data
    await user.save();
    logger.info("User updated: %s", userId);

    res.json({
      ...user.toObject(),
    });
  } catch (error) {
    logger.error("Error updating user %s: %o", req.params.id, error);
    res.status(500).json({ message: "Error updating user data", error });
  }
};

const NOTIFICATION_KEYS = ["friendRequests", "recipeShares"];

// Update user preferences
const updatePreferences = async (
  req: Request<{ id: string }, {}, Partial<Preferences>>,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const preferences = req.body;

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn(
        "Attempted to update preferences for non-existent user: %s",
        userId
      );
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Merge and validate notificationPreferences
    const updatedNotificationPreferences: Record<string, boolean> = {};
    for (const key of NOTIFICATION_KEYS) {
      updatedNotificationPreferences[key] =
        preferences.notificationPreferences?.[key] ??
        user.preferences?.notificationPreferences?.[key] ??
        true; // default to true
    }

    // Merge and validate preferences
    const updatedPreferences: Preferences = {
      allergies: preferences.allergies ?? user.preferences?.allergies ?? [],
      dietaryPreferences: {
        vegan:
          preferences.dietaryPreferences?.vegan ??
          user.preferences?.dietaryPreferences?.vegan ??
          false,
        vegetarian:
          preferences.dietaryPreferences?.vegetarian ??
          user.preferences?.dietaryPreferences?.vegetarian ??
          false,
        pescatarian:
          preferences.dietaryPreferences?.pescatarian ??
          user.preferences?.dietaryPreferences?.pescatarian ??
          false,
        carnivore:
          preferences.dietaryPreferences?.carnivore ??
          user.preferences?.dietaryPreferences?.carnivore ??
          false,
        ketogenic:
          preferences.dietaryPreferences?.ketogenic ??
          user.preferences?.dietaryPreferences?.ketogenic ??
          false,
        paleo:
          preferences.dietaryPreferences?.paleo ??
          user.preferences?.dietaryPreferences?.paleo ??
          false,
        lowCarb:
          preferences.dietaryPreferences?.lowCarb ??
          user.preferences?.dietaryPreferences?.lowCarb ??
          false,
        lowFat:
          preferences.dietaryPreferences?.lowFat ??
          user.preferences?.dietaryPreferences?.lowFat ??
          false,
        glutenFree:
          preferences.dietaryPreferences?.glutenFree ??
          user.preferences?.dietaryPreferences?.glutenFree ??
          false,
        dairyFree:
          preferences.dietaryPreferences?.dairyFree ??
          user.preferences?.dietaryPreferences?.dairyFree ??
          false,
        kosher:
          preferences.dietaryPreferences?.kosher ??
          user.preferences?.dietaryPreferences?.kosher ??
          false,
        halal:
          preferences.dietaryPreferences?.halal ??
          user.preferences?.dietaryPreferences?.halal ??
          false,
      },
      notificationPreferences: updatedNotificationPreferences,
    };

    // Update the user's preferences
    user.preferences = updatedPreferences;

    // Save the updated user
    await user.save();

    logger.info("Preferences updated for user: %s", userId);
    res
      .status(200)
      .json({
        message: "Preferences updated successfully",
        preferences: user.preferences,
      });
  } catch (error) {
    logger.error(
      "Error updating preferences for user %s: %o",
      req.params.id,
      error
    );
    res.status(500).json({ message: "Error updating preferences", error });
  }
};

// Update FCM token
const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400).json({ message: "FCM token is required" });
      return;
    }

    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    logger.error(
      "Error updating FCM token for user %s: %o",
      getUserId(req),
      error
    );
    res.status(500).json({ message: "Error updating FCM token", error });
  }
};

// Delete user data
const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await userModel.findById(userId);

    if (!user) {
      logger.warn("Attempted to delete non-existent user: %s", userId);
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Delete user's profile picture if it exists
    if (user.profilePicture && user.profilePicture !== "") {
      const filePath = path.resolve(
        __dirname,
        "../../uploads",
        path.basename(user.profilePicture)
      );
      logger.info("Deleting profile picture for user %s: %s", userId, filePath);
      await deleteFile(filePath);
    }

    // Delete the user's fridge and cookbook
    await fridgeModel.findByIdAndDelete(user.fridgeId);
    await cookbookModel.findByIdAndDelete(user.cookbookId);

    // Delete the user from the database
    await userModel.findByIdAndDelete(userId);

    logger.info("User deleted: %s", userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("Error deleting user %s: %o", req.params.id, error);
    res.status(500).json({ message: "Error deleting user", error });
  }
};

// Find users by query
const findUsersByQuery = async (req: Request, res: Response): Promise<void> => {
  const query = req.query.query as string;
  if (!query) {
    logger.warn("User search attempted without query parameter");
    res.status(400).json({ error: "Query parameter is required" });
    return;
  }

  try {
    const users = await userModel
      .find({
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      })
      .select("_id firstName lastName email profilePicture joinDate");
    logger.info(
      "User search for query '%s' returned %d users",
      query,
      users.length
    );
    res.json(users);
  } catch (error) {
    logger.error("Error fetching users by name: %o", error);
    res.status(500).json({ error: "Error fetching users" });
  }
};

// Get another user's public profile
const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    // Prevent reserved words from being treated as IDs
    if (["friends", "me", "preferences", "fcm-token"].includes(userId)) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    const user = await userModel
      .findById(userId)
      .select("_id firstName lastName email profilePicture joinDate");
    if (!user) {
      logger.warn("Public profile not found for user: %s", userId);
      res.status(404).json({ message: "User not found" });
      return;
    }
    logger.info("Public profile fetched for user: %s", userId);
    res.json(user);
  } catch (error) {
    logger.error(
      "Error fetching public profile for user %s: %o",
      req.params.id,
      error
    );
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

// Get user stats
const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const stats = await getUserStatsForSocket(userId);

    if (!stats) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(stats);
  } catch (error) {
    logger.error(
      "Error fetching user stats for user %s: %o",
      req.params.id,
      error
    );
    res.status(500).json({ message: "Error fetching user stats", error });
  }
};

export default {
  getUserData,
  updateUser,
  updatePreferences,
  updateFcmToken,
  deleteUser,
  findUsersByQuery,
  getUserProfile,
  getUserStats,
};
