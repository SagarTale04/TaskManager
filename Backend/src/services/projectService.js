import Project from "../models/Project.js";
import Team from "../models/Team.js";
import { getProjectWithAccess } from "./accessService.js";

export const createProjectService = async ({
  teamId,
  name,
  description,
  createdBy,
}) => {
  const team = await Team.findByPk(teamId);

  if (!team) {
    const error = new Error("Team not found");
    error.statusCode = 404;
    throw error;
  }

  const project = await Project.create({
    teamId,
    name,
    description,
    createdBy,
  });

  return project;
};

export const getTeamProjectsService = async (teamId) => {
  const projects = await Project.findAll({
    where: {
      teamId,
    },
    order: [["created_at", "DESC"]],
  });

  return projects;
};

export const getProjectByIdService = async ({ projectId, userId }) => {
  const { project } = await getProjectWithAccess({ projectId, userId });
  return project;
};

export const updateProjectService = async ({
  projectId,
  userId,
  name,
  description,
  status,
}) => {
  const { project, membership } = await getProjectWithAccess({
    projectId,
    userId,
  });

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    const error = new Error(
      "You do not have permission to update this project"
    );
    error.statusCode = 403;
    throw error;
  }

  if (status && !["ACTIVE", "ARCHIVED"].includes(status)) {
    const error = new Error("Invalid project status");
    error.statusCode = 400;
    throw error;
  }

  if (name !== undefined) {
    project.name = name;
  }

  if (description !== undefined) {
    project.description = description;
  }

  if (status !== undefined) {
    project.status = status;
  }

  await project.save();

  return project;
};

export const archiveProjectService = async ({ projectId, userId }) => {
  const { project, membership } = await getProjectWithAccess({
    projectId,
    userId,
  });

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    const error = new Error(
      "You do not have permission to archive this project"
    );
    error.statusCode = 403;
    throw error;
  }

  if (project.status === "ARCHIVED") {
    const error = new Error("Project is already archived");
    error.statusCode = 400;
    throw error;
  }

  project.status = "ARCHIVED";

  await project.save();

  return project;
};