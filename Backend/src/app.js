import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import sprintRoutes from "./routes/sprintRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, tests)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// General Rate Limiting
app.use("/api", apiLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "SyncSprint API is running",
  });
});

app.use(errorHandler);

export default app;