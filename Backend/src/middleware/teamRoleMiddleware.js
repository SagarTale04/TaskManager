import TeamMember from "../models/TeamMember.js";

export const authorizeTeamRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { teamId } = req.params;

      const membership = await TeamMember.findOne({
        where: {
          teamId,
          userId: req.user.id,
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this team",
        });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
        });
      }

      req.teamMembership = membership;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};