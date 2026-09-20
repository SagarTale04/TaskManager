import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import validate from "../middleware/validate.js";
import { updateCommentSchema } from "../validators/commentValidator.js";

const router = express.Router();

router.patch("/:commentId", protect, validate(updateCommentSchema), updateComment);
router.delete("/:commentId", protect, deleteComment);

export default router;
