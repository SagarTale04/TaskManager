import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProjectById,
  updateProject,
  archiveProject,
} from "../controllers/projectController.js";
import {
  createSprint,
  getProjectSprints,
} from "../controllers/sprintController.js";
import {
  createTask,
  getProjectTasks,
} from "../controllers/taskController.js";
import validate from "../middleware/validate.js";
import { updateProjectSchema } from "../validators/projectValidator.js";
import { createSprintSchema } from "../validators/sprintValidator.js";
import { createTaskSchema } from "../validators/taskValidator.js";

const router = express.Router();

// Project individual routes
router.get("/:projectId", protect, getProjectById);
router.patch("/:projectId", protect, validate(updateProjectSchema), updateProject);
router.delete("/:projectId", protect, archiveProject);

// Nested sprint routes
router.post("/:projectId/sprints", protect, validate(createSprintSchema), createSprint);
router.get("/:projectId/sprints", protect, getProjectSprints);

// Nested task routes
router.post("/:projectId/tasks", protect, validate(createTaskSchema), createTask);
router.get("/:projectId/tasks", protect, getProjectTasks);

export default router;