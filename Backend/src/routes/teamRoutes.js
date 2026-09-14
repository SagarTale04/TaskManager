import express from "express";

import {
  createTeam,
  getMyTeams,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "../controllers/teamController.js";

import {
  createProject,
  getTeamProjects,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { authorizeTeamRole } from "../middleware/teamRoleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("SUPER_ADMIN", "ADMIN"),
  createTeam
);

router.get(
  "/",
  protect,
  getMyTeams
);

router.post(
  "/:teamId/members",
  protect,
  authorizeTeamRole("OWNER", "ADMIN"),
  addTeamMember
);

router.patch(
  "/:teamId/members/:userId",
  protect,
  authorizeTeamRole("OWNER"),
  updateTeamMemberRole
);

router.delete(
  "/:teamId/members/:userId",
  protect,
  authorizeTeamRole("OWNER", "ADMIN"),
  removeTeamMember
);

router.post(
  "/:teamId/projects",
  protect,
  authorizeTeamRole("OWNER", "ADMIN"),
  createProject
);

router.get(
  "/:teamId/projects",
  protect,
  authorizeTeamRole("OWNER", "ADMIN", "MEMBER"),
  getTeamProjects
);

export default router;