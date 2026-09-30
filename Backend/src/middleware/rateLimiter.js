import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";

/**
 * Standard error response for rate limit violations.
 */
const rateLimitHandler = (message) => (req, res) => {
  return res.status(429).json({
    success: false,
    message,
  });
};

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/**
 * Creates a RedisStore for distributed rate limiting if Redis client is available.
 * If Redis is not connected or in test mode, returns undefined to safely fallback to in-memory store.
 */
const createRedisStore = (prefix) => {
  if (!redisClient || isTest) {
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `syncsprint:rl:${prefix}:`,
  });
};

/**
 * General API rate limiter (200 requests per 15 minutes in production; 5000 in dev).
 * Bypassed in test environment to avoid interfering with automated test suites.
 * Uses Redis store when available, with automatic fail-open (passOnStoreError: true).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  store: createRedisStore("api"),
  passOnStoreError: true,
  handler: rateLimitHandler("Too many requests, please try again later"),
});

/**
 * Strict authentication rate limiter (10 attempts per 15 minutes in production; 1000 in dev).
 * Applied to login and registration endpoints to protect against brute-force attacks.
 * Bypassed in test environment to avoid interfering with automated test suites.
 * Uses Redis store when available, with automatic fail-open (passOnStoreError: true).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  store: createRedisStore("auth"),
  passOnStoreError: true,
  handler: rateLimitHandler(
    "Too many authentication attempts, please try again later"
  ),
});
