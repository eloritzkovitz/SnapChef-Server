import express from "express";
import {
  saveRecipe,
  removeSavedRecipe,
  shareRecipe,
  getSavedRecipes,
} from "./cookbookController";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Cookbook
 *   description: API for managing saved recipes
 */

/**
 * @swagger
 * /api/cookbook/save:
 *   post:
 *     summary: Save a recipe to the cookbook
 *     tags: [Cookbook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               recipeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recipe saved
 */
router.post("/save", saveRecipe);

/**
 * @swagger
 * /api/cookbook/remove:
 *   delete:
 *     summary: Remove a recipe from the cookbook
 *     tags: [Cookbook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               recipeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recipe removed
 */

router.delete("/remove", removeSavedRecipe);
/**
 * @swagger
 * /api/cookbook/share:
 *   post:
 *     summary: Share a saved recipe with a friend
 *     tags: [Cookbook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               recipeId:
 *                 type: string
 *               friendId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recipe shared successfully
 */
router.post("/share", shareRecipe);

/**
 * @swagger
 * /api/cookbook:
 *   get:
 *     summary: Get all saved recipes for a user
 *     tags: [Cookbook]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of saved recipes
 */

router.get("/", getSavedRecipes);

export default router;
