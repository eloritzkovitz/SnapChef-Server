// filepath: src/modules/users/userHelpers.ts
import userModel from "./User";
import fridgeModel from "../fridge/Fridge";
import cookbookModel from "../cookbook/Cookbook";

// Create a user with default fridge and cookbook
export async function createUserWithDefaults({
  firstName,
  lastName,
  email,
  password,
  profilePicture = "",
}: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string;
}) {
  const user = await userModel.create({
    firstName,
    lastName,
    email,
    password,
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

  return user;
}