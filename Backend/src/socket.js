import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import redisClient, { isRedisConnected } from "./config/redis.js";
import { isTokenBlacklisted } from "./services/tokenBlacklistService.js";

let io = null;

/**
 * Initializes the Socket.IO server attached to the Node HTTP server.
 * Connects the Redis Pub/Sub adapter if Redis is available, with graceful fallback.
 */
export const initSocketServer = async (httpServer, allowedOrigins = ["*"]) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Attach Redis Pub/Sub Adapter for multi-instance sync if Redis is online
  if (isRedisConnected() && redisClient) {
    try {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();

      pubClient.on("error", (err) => {
        console.warn("[Socket.IO Redis Pub] Adapter error:", err.message);
      });
      subClient.on("error", (err) => {
        console.warn("[Socket.IO Redis Sub] Adapter error:", err.message);
      });

      await Promise.all([pubClient.connect().catch(() => {}), subClient.connect().catch(() => {})]);

      io.adapter(createAdapter(pubClient, subClient));
      console.log("[Socket.IO] Redis Pub/Sub adapter initialized successfully.");
    } catch (adapterErr) {
      console.warn("[Socket.IO] Could not attach Redis adapter. Operating in single-server memory mode:", adapterErr.message);
    }
  } else {
    console.log("[Socket.IO] Running with local memory adapter (single server).");
  }

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!authHeader) {
        // Allow unauthenticated connection or continue with guest status
        return next();
      }

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      // Verify token blacklist
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        return next(new Error("Token has been revoked"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection Handler
  io.on("connection", (socket) => {
    if (socket.user?.id) {
      // Auto-join personal notification room
      socket.join(`user:${socket.user.id}`);
    }

    // Room subscription handlers
    socket.on("join:project", (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    socket.on("leave:project", (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on("join:task", (taskId) => {
      if (taskId) socket.join(`task:${taskId}`);
    });

    socket.on("leave:task", (taskId) => {
      if (taskId) socket.leave(`task:${taskId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

/**
 * Returns the active Socket.IO server instance.
 */
export const getIO = () => io;

/**
 * Broadcasts an event to all clients viewing a specific project/board.
 */
export const emitToProject = (projectId, event, payload) => {
  if (!io || !projectId) return;
  io.to(`project:${projectId}`).emit(event, payload);
};

/**
 * Broadcasts an event to all clients viewing a specific task detail modal/page.
 */
export const emitToTask = (taskId, event, payload) => {
  if (!io || !taskId) return;
  io.to(`task:${taskId}`).emit(event, payload);
};

/**
 * Sends a real-time event to a specific user (for direct notifications).
 */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
};
