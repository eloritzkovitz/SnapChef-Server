import { Request, Response } from "express";
import path from "path";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import userModel from "./User";
import fridgeModel from "../fridge/Fridge";
import cookbookModel from "../cookbook/Cookbook";
import { deleteFile } from "../../utils/fileService";
import { generateToken, verifyRefreshToken } from "../../utils/tokenService";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google sign-in
const googleSignIn = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).send("Invalid Google ID token");
      return;
    }

    const { sub, email, given_name, family_name, picture } = payload;
    let user = await userModel.findOne({ email });

    if (!user) {
      // Create a new user if one does not exist
      user = await userModel.create({
        firstName: given_name,
        lastName: family_name,
        email,
        password: sub, // Use Google sub as a placeholder password
        profilePicture: picture,
        joinDate: new Date().toISOString(),
      });
    }

    // Generate tokens
    const tokens = generateToken(user._id);
    if (!tokens) {
      res.status(500).send("Server Error");
      return;
    }

    // Set the latest refresh token (overwrite any existing one)
    user.refreshToken = tokens.refreshToken; // Store only the latest refresh token
    await user.save();

    // Send back the tokens to the client
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Register function
const register = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const profilePicture = "";
    const user = await userModel.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      profilePicture,
      joinDate: new Date().toISOString(),
    });

    // Create a fridge for the user
    const fridge = await fridgeModel.create({
      ownerId: user._id,
      ingredients: [],
    });

    // Create a cookbook for the user
    const cookbook = await cookbookModel.create({
      ownerId: user._id,
      recipes: [],
    });

    // Associate the fridge and cookbook IDs with the user
    user.fridgeId = fridge._id as any;
    user.cookbookId = cookbook._id as any;
    await user.save();

    res.status(200).send(user);
  } catch (err) {
    res.status(400).send(err);
  }
};

// Login function
const login = async (req: Request, res: Response) => {
  try {
    // Find user by email
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).send("Wrong username or password");
      return;
    }

    // Validate password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      res.status(400).send("Wrong username or password");
      return;
    }

    // Ensure TOKEN_SECRET is available
    if (!process.env.TOKEN_SECRET) {
      res.status(500).send("Server Error");
      return;
    }

    // Generate new access and refresh tokens
    const tokens = generateToken(user._id);
    if (!tokens) {
      res.status(500).send("Server Error");
      return;
    }

    // Set the latest refresh token (overwrite any existing one)
    user.refreshToken = tokens.refreshToken; // Store only the latest refresh token
    await user.save();

    // Send back the tokens to the client
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Get user data
const getUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedUserId = req.params.id;
    const authenticatedUserId = req.params.userId;

    // Use the requested ID if available, otherwise fallback to the authenticated user
    const userId = requestedUserId || authenticatedUserId;

    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data", error });
  }
};

// Find users by name
const findUsersByName = async (req: Request, res: Response): Promise<void> => {
  const query = req.query.query as string;
  if (!query) {
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
    res.json(users);
  } catch (error) {
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
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update user details
    if (req.body.firstName !== undefined) user.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) user.lastName = req.body.lastName;
    if (req.body.headline !== undefined) user.headline = req.body.headline;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.location !== undefined) user.location = req.body.location;
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
        console.log(`Deleting file: ${filePath}`);
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

    res.json({
      ...user.toObject(),
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating user data", error });
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
      console.log(`Deleting file: ${filePath}`);
      deleteFile(filePath);
    }

    // Delete the user's fridge and cookbook
    await fridgeModel.findByIdAndDelete(user.fridgeId);
    await cookbookModel.findByIdAndDelete(user.cookbookId);

    // Delete the user from the database
    await userModel.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

// Logout function
const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token is required" });
    return;
  }

  try {
    const user = await verifyRefreshToken(refreshToken);
    await user.save();
    res.status(200).send("success");
  } catch (err) {
    res.status(400).send("fail");
  }
};

// Refresh tokens
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingToken = req.body.refreshToken?.trim();
    if (!incomingToken) {
      res.status(400).send("Refresh token required");
      return;
    }

    // Verify the refresh token
    const user = await verifyRefreshToken(incomingToken);
    if (!user) {
      res.status(401).send("Invalid token");
      return;
    }

    // Generate new tokens
    const tokens = generateToken(user._id);
    if (tokens) {
      user.refreshToken = tokens.refreshToken;
    } else {
      res.status(500).send("Failed to generate tokens");
      return;
    }
    await user.save();

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
    return;
  } catch (err) {
    res.status(400).send("Failed to refresh token");
    return;
  }
};

export default {
  register,
  googleSignIn,
  login,
  getUserData,
  findUsersByName,
  updateUser,
  deleteUser,
  refresh,
  logout,
};
