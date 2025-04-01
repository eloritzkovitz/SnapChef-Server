import express from "express";
import {
  saveRecipe,
  removeSavedRecipe,
  shareRecipe,
  getSavedRecipes,
} from "./cookbookController";

const router = express.Router();

router.post("/save", saveRecipe);
router.delete("/remove", removeSavedRecipe);
router.post("/share", shareRecipe);
router.get("/", getSavedRecipes);

export default router;
