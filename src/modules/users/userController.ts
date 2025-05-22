import { Request, Response } from "express";
import path from "path";
import bcrypt from "bcrypt";
import userModel from "./User";
import { Preferences } from "./Preferences";
import fridgeModel from "../fridge/Fridge";
import cookbookModel from "../cookbook/Cookbook";
import { deleteFile } from "../../utils/fileService";
import logger from "../../utils/logger";

// Get user data
const getUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedUserId = req.params.id;
    const authenticatedUserId = req.params.userId;

    // Use the requested ID if available, otherwise fallback to the authenticated user
    const userId = requestedUserId || authenticatedUserId;

    const user = await userModel.findById(userId).select("-password");
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

// Find users by name
const findUsersByName = async (req: Request, res: Response): Promise<void> => {
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
        ],
      })
      .select("_id firstName lastName profilePicture");
    logger.info("User search for query '%s' returned %d users", query, users.length);
    res.json(users);
  } catch (error) {
    logger.error("Error fetching users by name: %o", error);
    res.status(500).json({ error: "Error fetching users" });
  }
};

interface UpdateUserRequestBody {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  password?: string;
  profilePicture?: string;
}

// Update user data
const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
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
        const filePath = path.resolve(
          __dirname,
          "../../uploads",
          path.basename(user.profilePicture)
        );
        logger.info("Deleting old profile picture for user %s: %s", userId, filePath);
        deleteFile(filePath);
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

// Update user preferences
const updatePreferences = async (
  req: Request<{ id: string }, {}, Partial<Preferences>>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const preferences = req.body;

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn("Attempted to update preferences for non-existent user: %s", userId);
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Merge and validate preferences
    const updatedPreferences: Preferences = {
      allergies: preferences.allergies ?? user.preferences?.allergies ?? [],
      dietaryPreferences: {
        vegan: preferences.dietaryPreferences?.vegan ?? user.preferences?.dietaryPreferences?.vegan ?? false,
        vegetarian: preferences.dietaryPreferences?.vegetarian ?? user.preferences?.dietaryPreferences?.vegetarian ?? false,
        pescatarian: preferences.dietaryPreferences?.pescatarian ?? user.preferences?.dietaryPreferences?.pescatarian ?? false,
        carnivore: preferences.dietaryPreferences?.carnivore ?? user.preferences?.dietaryPreferences?.carnivore ?? false,
        ketogenic: preferences.dietaryPreferences?.ketogenic ?? user.preferences?.dietaryPreferences?.ketogenic ?? false,
        paleo: preferences.dietaryPreferences?.paleo ?? user.preferences?.dietaryPreferences?.paleo ?? false,
        lowCarb: preferences.dietaryPreferences?.lowCarb ?? user.preferences?.dietaryPreferences?.lowCarb ?? false,
        lowFat: preferences.dietaryPreferences?.lowFat ?? user.preferences?.dietaryPreferences?.lowFat ?? false,
        glutenFree: preferences.dietaryPreferences?.glutenFree ?? user.preferences?.dietaryPreferences?.glutenFree ?? false,
        dairyFree: preferences.dietaryPreferences?.dairyFree ?? user.preferences?.dietaryPreferences?.dairyFree ?? false,
        kosher: preferences.dietaryPreferences?.kosher ?? user.preferences?.dietaryPreferences?.kosher ?? false,
        halal: preferences.dietaryPreferences?.halal ?? user.preferences?.dietaryPreferences?.halal ?? false,
      },
    };

    // Update the user's preferences
    user.preferences = updatedPreferences;

    // Save the updated user
    await user.save();

    logger.info("Preferences updated for user: %s", userId);
    res.status(200).json({ message: "Preferences updated successfully", preferences: user.preferences });
  } catch (error) {
    logger.error("Error updating preferences for user %s: %o", req.params.id, error);
    res.status(500).json({ message: "Error updating preferences", error });
  }
};

// Delete user data
const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
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
      deleteFile(filePath);
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

export default {  
  getUserData,
  findUsersByName,
  updateUser,
  updatePreferences,
  deleteUser,  
};
