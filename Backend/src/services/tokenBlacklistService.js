import crypto from "crypto";
import jwt from "jsonwebtoken";
import { safeGet, safeSet, safeDel } from "../config/redis.js";

// In-memory fallback set for environments where Redis is not active
const memoryBlacklist = new Map();

/**
 * Cleanup expired tokens from in-memory fallback periodically.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of memoryBlacklist.entries()) {
    if (expiresAt <= now) {
      memoryBlacklist.delete(key);
    }
  }
}, 60 * 1000).unref(); // unref so this interval doesn't hold open Node process in tests

/**
 * Creates a deterministic SHA-256 hash of a JWT token for use as a Redis key.
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Blacklists a JWT token until its natural expiration.
 * @param {string} token - The raw JWT token string
 * @returns {Promise<boolean>}
 */
export const blacklistToken = async (token) => {
  if (!token) return false;

  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = decoded.exp - nowInSeconds;

    if (remainingSeconds <= 0) {
      return true; // Already expired naturally
    }

    const tokenHash = hashToken(token);
    const key = `syncsprint:blacklist:${tokenHash}`;

    // 1. Store in memory fallback
    memoryBlacklist.set(tokenHash, Date.now() + remainingSeconds * 1000);

    // 2. Store in Redis with TTL
    await safeSet(key, "1", remainingSeconds);

    return true;
  } catch (error) {
    console.warn("[TokenBlacklist] Failed to blacklist token:", error.message);
    return false;
  }
};

/**
 * Checks if a JWT token has been blacklisted / revoked.
 * @param {string} token - The raw JWT token string
 * @returns {Promise<boolean>}
 */
export const isTokenBlacklisted = async (token) => {
  if (!token) return false;

  try {
    const tokenHash = hashToken(token);

    // 1. Check in-memory fallback first
    const memoryExpiry = memoryBlacklist.get(tokenHash);
    if (memoryExpiry) {
      if (memoryExpiry > Date.now()) {
        return true;
      }
      memoryBlacklist.delete(tokenHash);
    }

    // 2. Check Redis
    const key = `syncsprint:blacklist:${tokenHash}`;
    const redisResult = await safeGet(key);

    return redisResult !== null;
  } catch (error) {
    // Fail-open: do not block authentications if blacklist check fails due to an error
    console.warn("[TokenBlacklist] Error checking token blacklist:", error.message);
    return false;
  }
};
