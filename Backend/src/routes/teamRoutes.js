import express from "express";

import { createTeam,getMyTeams,addTeamMember } from "../controllers/teamController.js";
import { authorizeTeamRole } from "../middleware/teamRoleMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("SUPER_ADMIN", "ADMIN"),
  createTeam
);
router.get('/',protect,getMyTeams)
router.post(
  "/:teamId/members",
  protect,
  authorizeTeamRole("OWNER", "ADMIN"),
  addTeamMember,
);

export default router;