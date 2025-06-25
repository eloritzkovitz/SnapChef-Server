import { Router } from "express";
import mongoose from "mongoose";
const pkg = require("../package.json");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Server
 *   description: API for server information and health checks
 */

/**
 * @swagger
 * /info:
 *   get:
 *     summary: Get API information
 *     tags: [Server]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 environment:
 *                   type: string
 */
router.get("/info", (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    environment: process.env.NODE_ENV || "development"
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server health
 *     tags: [Server]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 db:
 *                   type: string
 *                   example: up
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? "up" : "down";
  res.status(200).json({
    status: "ok",
    db: dbState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Ping the server
 *     tags: [Server]
 *     responses:
 *       200:
 *         description: Pong!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: pong
 */
router.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

export default router;
