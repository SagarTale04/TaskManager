import Project from "../models/Project.js";
import Sprint from "../models/Sprint.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import TeamMember from "../models/TeamMember.js";
import User from "../models/User.js";
import { cacheGet, cacheSet, cacheKeys, TTL } from "../utils/cacheHelper.js";

/**
 * Validates project existence and user's membership in the project's team.
 * Uses Redis to cache membership lookups to reduce repetitive DB joins.
 */
export const getProjectWithAccess = async ({ projectId, userId, user: passedUser }) => {
  const project = await Project.findByPk(projectId);

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const currentUser = passedUser || (userId ? await User.findByPk(userId) : null);
  if (currentUser && currentUser.role === "SUPER_ADMIN") {
    return {
      project,
      membership: {
        userId: currentUser.id,
        teamId: project.teamId,
        role: "OWNER",
        isSuperAdmin: true,
      },
    };
  }

  // Check Redis cache for user's team membership
  const memberKey = cacheKeys.teamMember(project.teamId, userId);
  let membership = await cacheGet(memberKey);

  if (!membership) {
    const dbMembership = await TeamMember.findOne({
      where: {
        teamId: project.teamId,
        userId,
      },
    });

    if (!dbMembership) {
      const error = new Error("You do not have access to this project");
      error.statusCode = 403;
      throw error;
    }

    membership = {
      id: dbMembership.id,
      teamId: dbMembership.teamId,
      userId: dbMembership.userId,
      role: dbMembership.role,
    };

    // Cache membership for 15 minutes
    await cacheSet(memberKey, membership, TTL.LONG);
  }

  return { project, membership };
};

/**
 * Validates sprint existence, parent project existence, and user's team membership.
 */
export const getSprintWithAccess = async ({ sprintId, userId }) => {
  const sprint = await Sprint.findByPk(sprintId);

  if (!sprint) {
    const error = new Error("Sprint not found");
    error.statusCode = 404;
    throw error;
  }

  const { project, membership } = await getProjectWithAccess({
    projectId: sprint.projectId,
    userId,
  });

  return { sprint, project, membership };
};

/**
 * Validates task existence, parent project existence, and user's team membership.
 */
export const getTaskWithAccess = async ({ taskId, userId }) => {
  const task = await Task.findByPk(taskId);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  const { project, membership } = await getProjectWithAccess({
    projectId: task.projectId,
    userId,
  });

  return { task, project, membership };
};

/**
 * Validates comment existence, parent task, parent project, and user's team membership.
 */
export const getCommentWithAccess = async ({ commentId, userId }) => {
  const comment = await Comment.findByPk(commentId);

  if (!comment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  const { task, project, membership } = await getTaskWithAccess({
    taskId: comment.taskId,
    userId,
  });

  return { comment, task, project, membership };
};
