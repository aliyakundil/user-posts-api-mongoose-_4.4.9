import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import userRoutes from "./routes/users";
import postRoutes from "./routes/posts";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectToDb } from "./config/database";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", userRoutes);
app.use("/api", postRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "User REST API",
    version: "1.0.0",
    links: {
      api: "/api",
      health: "/health",
      users: "/api/users",
      posts: "/api/posts",
    },
  });
});

app.get("/health", async (req, res) => {
  try {
    const state = mongoose.connection.readyState;

    const dbStatus =
      state === 1 ? "connected" : state === 2 ? "connecting" : "disconnected";

    res.json({
      db: dbStatus,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    res.status(503).json({
      db: "disconnected",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Closing MongoDB connection...");

  await mongoose.connection.close();

  console.log("MongoDB connection closed");
  process.exit(0);
});

async function startServer() {
  try {
    await connectToDb();

    app.listen(PORT, () => {
      console.log("Server started on port 3000");
    });
  } catch (err) {
    console.log("Failed to start server: ", err);
    process.exit(1);
  }
}

app.use(errorHandler);

startServer();
