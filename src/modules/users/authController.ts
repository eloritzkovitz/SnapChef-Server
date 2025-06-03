import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import userModel from "./User";
import { createUserWithDefaults } from "./userUtils";
import logger from "../../utils/logger";
import { generateToken, verifyRefreshToken } from "../../utils/tokenService";
import { generateOtp, sendOtpMail } from "../../utils/otpService";

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
      logger.warn("Invalid Google ID token received");
      res.status(400).send("Invalid Google ID token");
      return;
    }

    const { sub, email, given_name, family_name, picture } = payload;
    let user = await userModel.findOne({ email });

    // Validate required fields
    if (!email || !given_name || !family_name) {
      logger.error("Missing required Google profile fields: %o", payload);
      res
        .status(400)
        .send("Google account missing required profile information.");
      return;
    }

    if (!user) {
      logger.info("Creating new user from Google sign-in: %s", email);
      user = await createUserWithDefaults({
        firstName: given_name || "",
        lastName: family_name || "",
        email: email || "",
        password: sub, // Use Google sub as a placeholder password
        profilePicture: picture,
      });
      // Verify the user by default
      user.isVerified = true;
      await user.save();
    } else {
      logger.info("Existing user signed in with Google: %s", email);
    }

    // Generate tokens
    const tokens = generateToken(user._id);
    if (!tokens) {
      res.status(500).send("Server Error");
      return;
    }

    // Set the latest refresh token (overwrite any existing one)
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info("Google sign-in successful for user: %s", email);
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    logger.error("Google sign-in error: %o", err);
    res.status(400).send(err);
  }
};

// Register function
const register = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { otp, otpExpires } = generateOtp();

    const user = await createUserWithDefaults({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      profilePicture: "",
    });

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.isVerified = false;
    await user.save();

    // Send OTP via email
    await sendOtpMail(req.body.email, otp, "Verify your SnapChef account");
    logger.info("OTP sent to email for verification: %s", req.body.email);

    res.status(200).send(user);
  } catch (err) {
    logger.error("Registration error for %s: %o", req.body.email, err);
    res.status(400).send(err);
  }
};

// Login function
const login = async (req: Request, res: Response) => {
  try {
    // Find user by email
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      logger.warn("Login failed: user not found (%s)", req.body.email);
      res.status(400).send("Wrong username or password");
      return;
    }

    // Block login if not verified
    if (!user.isVerified) {
      res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
      return;
    }

    // Validate password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      logger.warn("Login failed: invalid password for %s", req.body.email);
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

    // Set the latest refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info("User logged in: %s", req.body.email);
    // Send back the tokens to the client
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    logger.error("Login error for %s: %o", req.body.email, err);
    res.status(400).send(err);
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

    logger.info("User logged out");
    res.status(200).send("success");
  } catch (err) {
    logger.error("Logout error: %o", err);
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

    logger.info("Token refreshed for user: %s", user.email);
    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
    return;
  } catch (err) {
    logger.error("Token refresh error: %o", err);
    res.status(400).send("Failed to refresh token");
    return;
  }
};

// Verify OTP for email verification
const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required." });
    return;
  }

  try {
    const user = await userModel.findOne({ email });

    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      res.status(400).json({ message: "Invalid or expired OTP." });
      return;
    }

    // OTP is valid, clear it and mark as verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    logger.error("Error verifying OTP: %o", error);
    res.status(500).json({ message: "Error verifying OTP", error });
  }
};

// Resend OTP
const resendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required." });
    return;
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOtpMail(email, otp, "Your SnapChef password reset code");
    logger.info("OTP resent to email: %s", email);
    
    res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    logger.error("Error resending OTP: %o", error);
    res.status(500).json({ message: "Error resending OTP", error });
  }
};

// Request password reset (send OTP)
const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required." });
    return;
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via email
    await sendOtpMail(
      email,
      otp,
      "SnapChef Password Reset OTP"
    );

    logger.info("Password reset OTP sent to email: %s", email);

    res.status(200).json({ message: "Password reset OTP sent successfully." });
  } catch (error) {
    logger.error("Error sending password reset OTP: %o", error);
    res
      .status(500)
      .json({ message: "Error sending password reset OTP", error });
  }
};

// Confirm password reset (with OTP and new password)
const confirmPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res
      .status(400)
      .json({ message: "Email, OTP, and new password are required." });
    return;
  }

  try {
    const user = await userModel.findOne({ email });
    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      res.status(400).json({ message: "Invalid or expired OTP." });
      return;
    }

    // Update password and clear OTP
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    logger.error("Error confirming password reset: %o", error);
    res.status(500).json({ message: "Error confirming password reset", error });
  }
};

export default {
  googleSignIn,
  register,
  login,
  logout,
  refresh,
  verifyOtp,
  resendOtp,
  requestPasswordReset,
  confirmPasswordReset,
};
