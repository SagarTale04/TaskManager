import Comment from "../models/Comment.js";
import User from "../models/User.js";
import {
  getTaskWithAccess,
  getCommentWithAccess,
} from "./accessService.js";

export const createCommentService = async ({ taskId, userId, content }) => {
  const { project } = await getTaskWithAccess({ taskId, userId });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot comment on a task in an archived project");
    error.statusCode = 400;
    throw error;
  }

  if (!content || !content.trim()) {
    const error = new Error("Comment content is required");
    error.statusCode = 400;
    throw error;
  }

  const comment = await Comment.create({
    taskId,
    userId,
    content: content.trim(),
  });

  const createdComment = await Comment.findByPk(comment.id, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "name", "email"],
      },
    ],
  });

  return createdComment;
};

export const getTaskCommentsService = async ({ taskId, userId }) => {
  await getTaskWithAccess({ taskId, userId });

  const comments = await Comment.findAll({
    where: { taskId },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["created_at", "ASC"]],
  });

  return comments;
};

export const updateCommentService = async ({ commentId, userId, content }) => {
  const { comment, project } = await getCommentWithAccess({
    commentId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot update comment in an archived project");
    error.statusCode = 400;
    throw error;
  }

  if (comment.userId !== userId) {
    const error = new Error("You can only edit your own comments");
    error.statusCode = 403;
    throw error;
  }

  if (!content || !content.trim()) {
    const error = new Error("Comment content is required");
    error.statusCode = 400;
    throw error;
  }

  comment.content = content.trim();
  await comment.save();

  const updated = await Comment.findByPk(comment.id, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "name", "email"],
      },
    ],
  });

  return updated;
};

export const deleteCommentService = async ({ commentId, userId }) => {
  const { comment, project, membership } = await getCommentWithAccess({
    commentId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot delete comment in an archived project");
    error.statusCode = 400;
    throw error;
  }

  const isAuthor = comment.userId === userId;
  const isTeamAdminOrOwner = ["OWNER", "ADMIN"].includes(membership.role);

  if (!isAuthor && !isTeamAdminOrOwner) {
    const error = new Error(
      "You do not have permission to delete this comment"
    );
    error.statusCode = 403;
    throw error;
  }

  await comment.destroy();

  return { id: commentId };
};
