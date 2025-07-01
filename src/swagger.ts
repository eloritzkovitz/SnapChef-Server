import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

// Load package.json for dynamic version/info
const pkg = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../package.json"),
    "utf-8"
  )
);

// Define the OpenAPI specification options
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SnapChef API",
      version: pkg.version || "1.0.0",
      description: pkg.description || "API server for the SnapChef application",
    },
    tags: [
      { name: "Server" },
      { name: "Auth" },
      { name: "Users" },
      { name: "Friends" },
      { name: "Ingredients" },
      { name: "Ingredient Recognition" },
      { name: "Fridge" },
      { name: "Groceries" },
      { name: "Recipes" },
      { name: "Cookbook" },
      { name: "Shared Recipes" },
      { name: "Notifications" },
      { name: "Analytics" }
    ],
    servers: [
      { url: "http://localhost:" + process.env.PORT, }, {url: "https://10.10.248.111", }, { url: "https://snapchef.cs.colman.ac.il", },
      {url: "http://10.10.248.111", }
    ],
  },
  apis: [
    "./src/modules/**/serverRoutes.ts",
    "./src/modules/**/authRoutes.ts",
    "./src/modules/**/userRoutes.ts",
    "./src/modules/**/friendsRoutes.ts",
    "./src/modules/**/ingredientRoutes.ts",
    "./src/modules/**/recognitionRoutes.ts",
    "./src/modules/**/fridgeRoutes.ts",
    "./src/modules/**/groceriesRoutes.ts",
    "./src/modules/**/recipeRoutes.ts",
    "./src/modules/**/cookbookRoutes.ts",
    "./src/modules/**/sharedRecipeRoutes.ts",
    "./src/modules/**/notificationRoutes.ts",
    "./src/modules/**/analyticsRoutes.ts",
  ],
};

// Generate the OpenAPI specification
const specs = swaggerJsDoc(options);

export { specs, swaggerUI };