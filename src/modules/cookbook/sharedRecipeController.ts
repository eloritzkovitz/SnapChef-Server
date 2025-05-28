import { Request, Response } from "express";
import SharedRecipe from "./SharedRecipe";
import { getUserId } from "../../utils/requestHelpers";
import logger from "../../utils/logger";

// Get recipes shared with and by the user
const getSharedRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const [sharedWithMe, sharedByMe] = await Promise.all([
      SharedRecipe.find({ toUser: userId }),
      SharedRecipe.find({ fromUser: userId }),
    ]);
    res.status(200).json({
      sharedWithMe,
      sharedByMe,
    });
  } catch (error) {
    logger.error(
      "Error fetching shared recipes for user %s: %o",
      getUserId(req),
      error
    );
    res.status(500).json({ message: "Failed to fetch shared recipes" });
  }
};

// Delete a shared recipe
const deleteSharedRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { sharedRecipeId } = req.params;
    // Allow deletion if the user is either the sender or the recipient
    const sharedRecipe = await SharedRecipe.findOneAndDelete({
      _id: sharedRecipeId,
      $or: [{ toUser: userId }, { fromUser: userId }],
    });
    if (!sharedRecipe) {
      res.status(404).json({ message: "Shared recipe not found or not authorized" });
      return;
    }
    res.status(200).json({ message: "Shared recipe removed" });
  } catch (error) {
    logger.error(
      "Error deleting shared recipe %s for user %s: %o",
      req.params.sharedRecipeId,
      getUserId(req),
      error
    );
    res.status(500).json({ message: "Failed to remove shared recipe" });
  }
};

export default {
  getSharedRecipes,  
  deleteSharedRecipe,
};