import Task from "../models/Task.js";
import Sprint from "../models/Sprint.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import TeamMember from "../models/TeamMember.js";
import {
  getProjectWithAccess,
  getSprintWithAccess,
  getTaskWithAccess,
} from "./accessService.js";
import { Op } from "sequelize";

const VALID_TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const VALID_TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createTaskService = async ({
  projectId,
  userId,
  title,
  description,
  status,
  priority,
  storyPoints,
  assignedTo,
  dueDate,
  sprintId,
}) => {
  const { project, membership } = await getProjectWithAccess({
    projectId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot create task in an archived project");
    error.statusCode = 400;
    throw error;
  }

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    const error = new Error("You do not have permission to create a task");
    error.statusCode = 403;
    throw error;
  }

  if (!title || !title.trim()) {
    const error = new Error("Task title is required");
    error.statusCode = 400;
    throw error;
  }

  if (status !== undefined && !VALID_TASK_STATUSES.includes(status)) {
    const error = new Error("Invalid task status");
    error.statusCode = 400;
    throw error;
  }

  if (priority !== undefined && !VALID_TASK_PRIORITIES.includes(priority)) {
    const error = new Error("Invalid task priority");
    error.statusCode = 400;
    throw error;
  }

  if (sprintId) {
    const sprint = await Sprint.findByPk(sprintId);
    if (!sprint) {
      const error = new Error("Sprint not found");
      error.statusCode = 404;
      throw error;
    }
    if (sprint.projectId !== project.id) {
      const error = new Error("Sprint does not belong to this project");
      error.statusCode = 400;
      throw error;
    }
    if (sprint.status === "CANCELLED") {
      const error = new Error("Cannot add task to a cancelled sprint");
      error.statusCode = 400;
      throw error;
    }
  }

  if (assignedTo) {
    const assigneeMember = await TeamMember.findOne({
      where: {
        teamId: project.teamId,
        userId: assignedTo,
      },
    });

    if (!assigneeMember) {
      const error = new Error(
        "Assigned user is not a member of this project's team"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const task = await Task.create({
    projectId: project.id,
    sprintId: sprintId || null,
    title: title.trim(),
    description: description || null,
    status: status || "TODO",
    priority: priority || "MEDIUM",
    storyPoints: storyPoints !== undefined ? storyPoints : null,
    assignedTo: assignedTo || null,
    createdBy: userId,
    dueDate: dueDate || null,
  });

  return task;
};

export const getProjectTasksService = async ({
  projectId,
  userId,
  sprintId,
  status,
  priority,
  assignedTo,
  search,
  sortBy,
  order,
  page,
  limit,
}) => {
  await getProjectWithAccess({ projectId, userId });

  const where = { projectId };

  if (sprintId !== undefined) {
    where.sprintId = sprintId === "null" ? null : sprintId;
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  if (search?.trim()) {
    const searchTerm = search.trim();

    where[Op.or] = [
      {
        title: {
          [Op.iLike]: `%${searchTerm}%`,
        },
      },
      {
        description: {
          [Op.iLike]: `%${searchTerm}%`,
        },
      },
    ];
  }

  // Pagination
  const offset = (page - 1) * limit;

  // Sorting
  const sortFieldMap = {
    createdAt: "created_at",
    created_at: "created_at",
    dueDate: "due_date",
    due_date: "due_date",
    priority: "priority",
    status: "status",
    title: "title",
  };

  const selectedSortField = sortFieldMap[sortBy] || "created_at";

  const selectedOrder =
    order?.toUpperCase() === "ASC"
      ? "ASC"
      : "DESC";

  const { count, rows } = await Task.findAndCountAll({
    where,

    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "name", "email"],
      },
      {
        model: Sprint,
        as: "sprint",
        attributes: ["id", "name", "status"],
      },
    ],

    order: [[selectedSortField, selectedOrder]],

    limit,
    offset,
    distinct: true,
  });

  const totalPages = Math.ceil(count / limit);

  return {
    tasks: rows,

    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const getSprintTasksService = async ({ sprintId, userId }) => {
  await getSprintWithAccess({ sprintId, userId });

  const tasks = await Task.findAll({
    where: { sprintId },
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return tasks;
};

export const getTaskByIdService = async ({ taskId, userId }) => {
  await getTaskWithAccess({ taskId, userId });

  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "name", "email"],
      },
      {
        model: Sprint,
        as: "sprint",
        attributes: ["id", "name", "status"],
      },
      {
        model: Project,
        as: "project",
        attributes: ["id", "name", "teamId", "status"],
      },
      {
        model: Comment,
        as: "comments",
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "email"],
          },
        ],
      },
    ],
  });

  return task;
};

export const updateTaskService = async ({
  taskId,
  userId,
  title,
  description,
  status,
  priority,
  storyPoints,
  assignedTo,
  dueDate,
  sprintId,
}) => {
  const { task, project, membership } = await getTaskWithAccess({
    taskId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot update task in an archived project");
    error.statusCode = 400;
    throw error;
  }

  const isManagement = ["OWNER", "ADMIN"].includes(membership.role);
  if (!isManagement) {
    if (task.assignedTo !== userId) {
      const error = new Error("Developers are only permitted to update their own assigned tasks");
      error.statusCode = 403;
      throw error;
    }

    const isTryingToUpdateOtherFields =
      title !== undefined ||
      description !== undefined ||
      priority !== undefined ||
      storyPoints !== undefined ||
      assignedTo !== undefined ||
      dueDate !== undefined ||
      sprintId !== undefined;

    if (isTryingToUpdateOtherFields || status === undefined) {
      const error = new Error("Members are only permitted to update task status");
      error.statusCode = 403;
      throw error;
    }
  }

  if (title !== undefined) {
    if (!title || !title.trim()) {
      const error = new Error("Task title cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    task.title = title.trim();
  }

  if (status !== undefined) {
    if (!VALID_TASK_STATUSES.includes(status)) {
      const error = new Error("Invalid task status");
      error.statusCode = 400;
      throw error;
    }
    task.status = status;
  }

  if (priority !== undefined) {
    if (!VALID_TASK_PRIORITIES.includes(priority)) {
      const error = new Error("Invalid task priority");
      error.statusCode = 400;
      throw error;
    }
    task.priority = priority;
  }

  if (description !== undefined) {
    task.description = description;
  }

  if (storyPoints !== undefined) {
    task.storyPoints = storyPoints;
  }

  if (dueDate !== undefined) {
    task.dueDate = dueDate;
  }

  if (sprintId !== undefined) {
    if (sprintId === null || sprintId === 0) {
      task.sprintId = null;
    } else {
      const sprint = await Sprint.findByPk(sprintId);
      if (!sprint) {
        const error = new Error("Sprint not found");
        error.statusCode = 404;
        throw error;
      }
      if (sprint.projectId !== project.id) {
        const error = new Error("Sprint does not belong to this project");
        error.statusCode = 400;
        throw error;
      }
      if (sprint.status === "CANCELLED") {
        const error = new Error("Cannot assign task to a cancelled sprint");
        error.statusCode = 400;
        throw error;
      }
      task.sprintId = sprintId;
    }
  }

  if (assignedTo !== undefined) {
    if (assignedTo === null || assignedTo === 0) {
      task.assignedTo = null;
    } else {
      const assigneeMember = await TeamMember.findOne({
        where: {
          teamId: project.teamId,
          userId: assignedTo,
        },
      });

      if (!assigneeMember) {
        const error = new Error(
          "Assigned user is not a member of this project's team"
        );
        error.statusCode = 400;
        throw error;
      }
      task.assignedTo = assignedTo;
    }
  }

  await task.save();

  return task;
};

export const deleteTaskService = async ({ taskId, userId }) => {
  const { task, project, membership } = await getTaskWithAccess({
    taskId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot delete task in an archived project");
    error.statusCode = 400;
    throw error;
  }

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    const error = new Error("You do not have permission to delete this task");
    error.statusCode = 403;
    throw error;
  }

  await task.destroy();

  return { id: taskId };
};
