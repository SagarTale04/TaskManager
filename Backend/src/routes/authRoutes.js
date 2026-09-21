import express from "express";
import { register, login, getProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/me", protect, getProfile);

export default router;