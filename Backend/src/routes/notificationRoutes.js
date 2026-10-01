import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.post("/read-all", markAllAsRead);
router.delete("/", clearNotifications);

export default router;
