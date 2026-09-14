import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSprintById,
  updateSprint,
} from "../controllers/sprintController.js";
import { getSprintTasks } from "../controllers/taskController.js";

const router = express.Router();

router.get("/:sprintId", protect, getSprintById);
router.patch("/:sprintId", protect, updateSprint);
router.get("/:sprintId/tasks", protect, getSprintTasks);

export default router;
