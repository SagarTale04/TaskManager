import express from "express";

import { createTeam,getMyTeams,addTeamMember,updateTeamMemberRole,removeTeamMember } from "../controllers/teamController.js";
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
router.patch("/:teamId/members/:userId",
protect,
authorizeTeamRole("OWNER"),
updateTeamMemberRole)

router.delete("/:teamId/members/:userId",
  protect,
  authorizeTeamRole("OWNER","ADMIN"),
  removeTeamMember)

export default router;