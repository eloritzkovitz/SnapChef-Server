import userModel, { IUser } from "../modules/users/User";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";

type tTokens = {
  accessToken: string;
  refreshToken: string;
};

// Generate token
export const generateToken = (userId: string): tTokens | null => {
  if (
    !process.env.TOKEN_SECRET ||
    !process.env.TOKEN_EXPIRES ||
    !process.env.REFRESH_TOKEN_EXPIRES
  ) {
    throw new Error(
      "Environment variables TOKEN_SECRET, TOKEN_EXPIRES, or REFRESH_TOKEN_EXPIRES are not set"
    );
  }

  // Generate token
  const random = Math.random().toString();
  const accessToken = jwt.sign(
    {
      _id: userId,
      random: random,
    },
    process.env.TOKEN_SECRET as string, // Explicitly cast to string
    { expiresIn: process.env.TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    {
      _id: userId,
      random: random,
    },
    process.env.TOKEN_SECRET as string, // Explicitly cast to string
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
  );

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

type tUser = Document<unknown, {}, IUser> &
  IUser &
  Required<{
    _id: string;
  }> & {
    __v: number;
  };

// Verify refresh token
export const verifyRefreshToken = (refreshToken: string | undefined): Promise<tUser> => {
  return new Promise(async (resolve, reject) => {
    if (!refreshToken) {
      return reject("Refresh token is required");
    }

    const secret = process.env.TOKEN_SECRET;
    if (!secret) {
      return reject("Token secret is missing");
    }

    // Log the token verification process
    jwt.verify(refreshToken, secret, async (err: any, payload: any) => {
      if (err || !payload?._id) {        
        return reject("Invalid token");
      }

      try {
        const user = await userModel.findById(payload._id);
        if (!user) {          
          return reject("User not found");
        }

        // Check if the refresh token matches
        if (user.refreshToken !== refreshToken) {          
          return reject("Invalid refresh token");
        }

        // Token verification successful, resolve the user
        resolve(user);
      } catch (err) {       
        reject("Database error");
      }
    });
  });
};