import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";
const isRedisEnabled = process.env.REDIS_ENABLED !== "false" && (!isTest || process.env.ENABLE_REDIS_IN_TEST === "true");

let redisClient = null;
let isConnected = false;
let hasLoggedConnectionWarning = false;

if (isRedisEnabled) {
  const commonOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        if (!hasLoggedConnectionWarning && !isTest) {
          console.warn("[Redis] Service unreachable after 3 retries. Operating in fallback (direct DB) mode.");
          hasLoggedConnectionWarning = true;
        }
        return null; // Stop reconnecting after 3 tries to prevent infinite loop
      }
      return Math.min(times * 300, 1000);
    },
  };

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const isTls = redisUrl.startsWith("rediss://");
    redisClient = new Redis(redisUrl, {
      ...commonOptions,
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
  } else {
    redisClient = new Redis({
      ...commonOptions,
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }

  redisClient.on("connect", () => {
    isConnected = true;
    hasLoggedConnectionWarning = false;
    if (!isTest) {
      console.log("[Redis] Connected successfully.");
    }
  });

  redisClient.on("ready", () => {
    isConnected = true;
  });

  redisClient.on("error", (err) => {
    isConnected = false;
    if (!hasLoggedConnectionWarning && !isTest) {
      console.warn(`[Redis] Connection warning: ${err.message}. Falling back gracefully.`);
      hasLoggedConnectionWarning = true;
    }
  });

  redisClient.on("close", () => {
    isConnected = false;
  });

  // Attempt non-blocking connection
  redisClient.connect().catch((err) => {
    isConnected = false;
    if (!hasLoggedConnectionWarning && !isTest) {
      console.warn(`[Redis] Could not connect initially: ${err.message}. App will run with direct DB.`);
      hasLoggedConnectionWarning = true;
    }
  });
}

/**
 * Returns whether Redis is actively connected and ready to accept commands.
 */
export const isRedisConnected = () => {
  return Boolean(redisClient && isConnected && redisClient.status === "ready");
};

/**
 * Safely fetches a value from Redis without throwing errors.
 * Returns null if Redis is offline, key is missing, or an error occurs.
 */
export const safeGet = async (key) => {
  if (!isRedisConnected()) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (error) {
    if (!isTest) console.warn(`[Redis safeGet Error] ${key}:`, error.message);
    return null;
  }
};

/**
 * Safely stores a value in Redis with a TTL in seconds.
 * Fails silently without crashing the caller if Redis is offline.
 */
export const safeSet = async (key, value, ttlSeconds = 300) => {
  if (!isRedisConnected()) return false;
  try {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(key, payload, "EX", ttlSeconds);
    } else {
      await redisClient.set(key, payload);
    }
    return true;
  } catch (error) {
    if (!isTest) console.warn(`[Redis safeSet Error] ${key}:`, error.message);
    return false;
  }
};

/**
 * Safely deletes a key or keys from Redis.
 */
export const safeDel = async (...keys) => {
  if (!isRedisConnected() || keys.length === 0) return 0;
  try {
    return await redisClient.del(...keys);
  } catch (error) {
    if (!isTest) console.warn(`[Redis safeDel Error]:`, error.message);
    return 0;
  }
};

/**
 * Safely deletes all keys matching a glob pattern using SCAN (non-blocking).
 */
export const safeDelPattern = async (pattern) => {
  if (!isRedisConnected()) return 0;
  try {
    let cursor = "0";
    let deletedCount = 0;
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        const deleted = await redisClient.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== "0");
    return deletedCount;
  } catch (error) {
    if (!isTest) console.warn(`[Redis safeDelPattern Error] ${pattern}:`, error.message);
    return 0;
  }
};

/**
 * Cleanly disconnects the Redis client (useful for tests and graceful shutdown).
 */
export const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      isConnected = false;
    }
  }
};

export default redisClient;
