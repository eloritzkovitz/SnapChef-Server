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

// Get user statistics for the socket connection
export async function getUserStatsForSocket(userId: string) {
  const user = await userModel.findById(userId);
  if (!user) return null;

  const fridge = await fridgeModel.findById(user.fridgeId);
  const cookbook = await cookbookModel.findById(user.cookbookId);

  // Count unique ingredients in the fridge
  const ingredientNames = fridge?.ingredients?.map((i: any) => i.name.toLowerCase()) || [];
  const uniqueIngredients = Array.from(new Set(ingredientNames));
  const ingredientCount = uniqueIngredients.length;

  // Count recipes and their ingredients
  const recipeCount = cookbook?.recipes?.length || 0;

  // Count total ingredients across all recipes
  const ingredientFrequency: Record<string, number> = {};
  cookbook?.recipes?.forEach((recipe: any) => {
    (recipe.ingredients || []).forEach((ing: any) => {
      const name = ing.name.toLowerCase();
      ingredientFrequency[name] = (ingredientFrequency[name] || 0) + 1;
    });
  });
  
  // Get the most popular ingredients
  const mostPopularIngredients = Object.entries(ingredientFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Count favorite recipes
  const favoriteRecipeCount = cookbook?.recipes?.filter((r: any) => r.isFavorite)?.length || 0;
  
  // Count friends
  const friendCount = user.friends?.length || 0;

  return {
    ingredientCount,
    recipeCount,
    mostPopularIngredients,
    favoriteRecipeCount,
    friendCount,
  };
}