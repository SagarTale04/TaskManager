import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import sprintRoutes from "./routes/sprintRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { protect } from "./middleware/authMiddleware.js";
import { getAllUsers } from "./controllers/authController.js";

const app = express();

// Security Headers with Swagger-compatible CSP
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": ["'self'", "'unsafe-inline'"],
                "style-src": ["'self'", "'unsafe-inline'"],
                "img-src": ["'self'", "data:", "validator.swagger.io"],
            },
        },
    })
);

// HTTP Request Logging (disabled in test environment)
app.use(
    morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
        skip: () => process.env.NODE_ENV === "test",
    })
);

// CORS Configuration
const serverPort = process.env.PORT || 5000;
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  `http://localhost:${serverPort}`,
  `http://127.0.0.1:${serverPort}`,
];

const envOrigins = [process.env.FRONTEND_URL, process.env.CLIENT_URL]
  .filter(Boolean)
  .flatMap((url) => url.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

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
app.get("/api/users", protect, getAllUsers);
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "SyncSprint API is running",
    });
});

// OpenAPI / Swagger Documentation
app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "SyncSprint API Documentation",
    })
);
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(swaggerSpec);
});

app.use(errorHandler);

export default app;