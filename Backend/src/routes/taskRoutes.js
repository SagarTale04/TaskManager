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
import validate from "../middleware/validate.js";
import { updateTaskSchema } from "../validators/taskValidator.js";
import { createCommentSchema } from "../validators/commentValidator.js";

const router = express.Router();

// Individual Task Routes
router.get("/:taskId", protect, getTaskById);
router.patch("/:taskId", protect, validate(updateTaskSchema), updateTask);
router.delete("/:taskId", protect, deleteTask);

// Nested Comment Routes on Task
router.post("/:taskId/comments", protect, validate(createCommentSchema), createComment);
router.get("/:taskId/comments", protect, getTaskComments);

export default router;
