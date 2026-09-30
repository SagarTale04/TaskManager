import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { safeGet, safeSet } from "../config/redis.js";
import { isTokenBlacklisted } from "../services/tokenBlacklistService.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        success: false,
        message: "authorization token needed",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "authorization token needed",
      });
    }

    // 1. Verify token is not blacklisted (e.g. after logout)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked or invalidated",
      });
    }

    // 2. Verify JWT signature & expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. User profile caching with fallback to DB
    const cacheKey = `syncsprint:user:${decoded.id}:profile`;
    let user = await safeGet(cacheKey);

    if (!user) {
      const dbUser = await User.findByPk(decoded.id, {
        attributes: ["id", "name", "email", "role"],
      });

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          message: "user not found",
        });
      }

      user = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };

      // Cache user profile for 15 minutes (900 seconds)
      await safeSet(cacheKey, user, 900);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};