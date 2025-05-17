import express, { Express } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import path from "path";
import fs from "fs";
import authRoutes from "./modules/users/authRoutes";
import userRoutes from "./modules/users/userRoutes";
import ingredientRoutes from "./modules/ingredients/ingredientRoutes";
import recipeRoutes from "./modules/recipes/recipeRoutes";
import fridgeRoutes from "./modules/fridge/fridgeRoutes";
import cookbookRoutes from "./modules/cookbook/cookbookRoutes";
import notificationRoutes from "./modules/notifications/notificationRoutes";

const app = express();

dotenv.config();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "../dist/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, '../dist/uploads')));

// Connect to MongoDB
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/fridge", fridgeRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/cookbook",cookbookRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/about", (req, res) => {
  res.send("This is the API for the SnapChef application.");
});

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SnapChef API",
      version: "1.0.0",
      description: "API server for the SnapChef application",
    },
    servers: [{ url: "http://localhost:" + process.env.PORT, },
    ],
  },
  apis: [
    "./src/modules/**/authRoutes.ts",
    "./src/modules/**/userRoutes.ts",
    "./src/modules/**/ingredientRoutes.ts",
    "./src/modules/**/fridgeRoutes.ts",
    "./src/modules/**/recipeRoutes.ts",    
    "./src/modules/**/cookbookRoutes.ts"
  ],
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

const initApp = () => {
  return new Promise<Express>(async (resolve, reject) => {
    if (process.env.DB_CONNECTION == undefined) {
      reject("DB_CONNECTION is not defined");
    } else {
      await mongoose.connect(process.env.DB_CONNECTION);
      resolve(app);
    }
  });
};

export default initApp;