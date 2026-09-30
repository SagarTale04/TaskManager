import http from "http";
import dotenv from "dotenv";

import app from "./app.js";
import sequelize from "./config/database.js";
import { initSocketServer } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected successfully.");

    const server = http.createServer(app);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    await initSocketServer(server, allowedOrigins);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();