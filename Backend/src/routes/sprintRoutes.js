import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSprintById,
  updateSprint,
} from "../controllers/sprintController.js";
import { getSprintTasks } from "../controllers/taskController.js";
import validate from "../middleware/validate.js";
import { updateSprintSchema } from "../validators/sprintValidator.js";

const router = express.Router();

router.get("/:sprintId", protect, getSprintById);
router.patch("/:sprintId", protect, validate(updateSprintSchema), updateSprint);
router.get("/:sprintId/tasks", protect, getSprintTasks);

export default router;
