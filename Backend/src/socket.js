import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import redisClient, { isRedisConnected } from "./config/redis.js";
import { isTokenBlacklisted } from "./services/tokenBlacklistService.js";
import { getUserNotifications } from "./services/notificationService.js";

let io = null;

/**
 * Initializes the Socket.IO server attached to the Node HTTP server.
 * Connects the Redis Pub/Sub adapter if Redis is available, with graceful fallback.
 */
export const initSocketServer = async (httpServer, allowedOrigins = ["*"]) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow origin dynamically so CORS never blocks sockets in dev or production
        callback(null, origin || true);
      },
      methods: ["GET", "POST"],
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
      console.warn("[Socket Auth] Handshake auth error:", err.message);
      // Still allow connection so guest or late-authenticating sockets connect
      next();
    }
  });

  // Connection Handler
  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket] Authenticated user ${userId} joined room 'user:${userId}'`);
      getUserNotifications(userId, true)
        .then((notifs) => {
          if (notifs && notifs.length > 0) {
            socket.emit("notifications:initial", notifs);
          }
        })
        .catch(() => {});
    }

    // Explicit room subscription handlers
    socket.on("join:user", (targetUserId) => {
      if (targetUserId) {
        socket.join(`user:${targetUserId}`);
        console.log(`[Socket] Socket ${socket.id} explicitly joined 'user:${targetUserId}'`);
        getUserNotifications(targetUserId, true)
          .then((notifs) => {
            if (notifs && notifs.length > 0) {
              socket.emit("notifications:initial", notifs);
            }
          })
          .catch(() => {});
      }
    });

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
  if (!io || !userId) {
    console.warn(`[Socket] emitToUser skipped: io=${Boolean(io)}, userId=${userId}`);
    return;
  }
  const room = `user:${userId}`;
  io.to(room).emit(event, payload);
  console.log(`[Socket] Emitted '${event}' to room '${room}':`, payload?.message || "");
};
