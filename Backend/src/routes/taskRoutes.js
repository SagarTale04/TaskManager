import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import {
  createComment,
  getTaskComments,
} from "../controllers/commentController.js";

const router = express.Router();

// Individual Task Routes
router.get("/:taskId", protect, getTaskById);
router.patch("/:taskId", protect, updateTask);
router.delete("/:taskId", protect, deleteTask);

// Nested Comment Routes on Task
router.post("/:taskId/comments", protect, createComment);
router.get("/:taskId/comments", protect, getTaskComments);

export default router;
