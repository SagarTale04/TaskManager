import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = express.Router();

router.patch("/:commentId", protect, updateComment);
router.delete("/:commentId", protect, deleteComment);

export default router;
