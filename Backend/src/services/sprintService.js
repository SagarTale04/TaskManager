import Sprint from "../models/Sprint.js";
import {
  getProjectWithAccess,
  getSprintWithAccess,
} from "./accessService.js";

const VALID_SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];

export const createSprintService = async ({
  projectId,
  userId,
  name,
  goal,
  startDate,
  endDate,
}) => {
  const { project, membership } = await getProjectWithAccess({
    projectId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot create sprint in an archived project");
    error.statusCode = 400;
    throw error;
  }

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    const error = new Error("You do not have permission to create a sprint");
    error.statusCode = 403;
    throw error;
  }

  const sprint = await Sprint.create({
    projectId,
    name,
    goal,
    startDate,
    endDate,
    createdBy: userId,
  });

  return sprint;
};

export const getProjectSprintsService = async ({ projectId, userId }) => {
  await getProjectWithAccess({ projectId, userId });

  const sprints = await Sprint.findAll({
    where: {
      projectId,
    },
    order: [["startDate", "ASC"]],
  });

  return sprints;
};

export const getSprintByIdService = async ({ sprintId, userId }) => {
  const { sprint } = await getSprintWithAccess({ sprintId, userId });
  return sprint;
};

export const updateSprintService = async ({
  sprintId,
  userId,
  name,
  goal,
  startDate,
  endDate,
  status,
}) => {
  const { sprint, project, membership } = await getSprintWithAccess({
    sprintId,
    userId,
  });

  if (project.status === "ARCHIVED") {
    const error = new Error("Cannot update sprint in an archived project");
    error.statusCode = 400;
    throw error;
  }

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    const error = new Error("You do not have permission to update this sprint");
    error.statusCode = 403;
    throw error;
  }

  if (status !== undefined && !VALID_SPRINT_STATUSES.includes(status)) {
    const error = new Error("Invalid sprint status");
    error.statusCode = 400;
    throw error;
  }

  const effectiveStart = startDate !== undefined ? startDate : sprint.startDate;
  const effectiveEnd = endDate !== undefined ? endDate : sprint.endDate;

  if (effectiveStart && effectiveEnd && new Date(effectiveEnd) < new Date(effectiveStart)) {
    const error = new Error("End date cannot be before start date");
    error.statusCode = 400;
    throw error;
  }

  if (name !== undefined) {
    sprint.name = name;
  }
  if (goal !== undefined) {
    sprint.goal = goal;
  }
  if (startDate !== undefined) {
    sprint.startDate = startDate;
  }
  if (endDate !== undefined) {
    sprint.endDate = endDate;
  }
  if (status !== undefined) {
    sprint.status = status;
  }

  await sprint.save();

  return sprint;
};
