import mongoose from "mongoose";
import userModel from "../modules/users/User";
import dotenv from "dotenv";

dotenv.config();

async function cleanupUnverifiedUsers() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION!, {});

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Delete users who are unverified and joined more than 7 days ago
    const result = await userModel.deleteMany({
      isVerified: false,
      $or: [        
        { createdAt: { $lt: cutoff } } // If using timestamps
      ]
    });

    console.log(`Deleted ${result.deletedCount} unverified users.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupUnverifiedUsers();