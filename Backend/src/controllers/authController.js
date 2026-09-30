import {
  registerUser,
  loginUser,
  logoutUser,
} from "../services/authService.js";
import User from "../models/User.js";
import { safeGet, safeSet } from "../config/redis.js";

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token =
      req.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    await logoutUser(token, req.user?.id);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to log out",
    });
  }
};

export const getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const getAllUsers = async (req, res) => {
  try {
    const cacheKey = "syncsprint:users:all";
    const cachedUsers = await safeGet(cacheKey);

    if (cachedUsers && Array.isArray(cachedUsers)) {
      return res.status(200).json({
        success: true,
        data: {
          users: cachedUsers,
        },
      });
    }

    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"],
      order: [["name", "ASC"]],
    });

    // Cache users list for 30 minutes (1800 seconds)
    await safeSet(cacheKey, users, 1800);

    return res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};