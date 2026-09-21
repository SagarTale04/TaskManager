import rateLimit from "express-rate-limit";

/**
 * Standard error response for rate limit violations.
 */
const rateLimitHandler = (message) => (req, res) => {
  return res.status(429).json({
    success: false,
    message,
  });
};

/**
 * General API rate limiter (200 requests per 15 minutes).
 * Bypassed in test environment to avoid interfering with automated test suites.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: rateLimitHandler("Too many requests, please try again later"),
});

/**
 * Strict authentication rate limiter (10 attempts per 15 minutes).
 * Applied to login and registration endpoints to protect against brute-force attacks.
 * Bypassed in test environment to avoid interfering with automated test suites.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: rateLimitHandler(
    "Too many authentication attempts, please try again later"
  ),
});
