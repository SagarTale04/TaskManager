import Project from "../models/Project.js";
import {
  createProjectService,
  getTeamProjectsService,
  getProjectByIdService,
  updateProjectService,
  archiveProjectService,
} from "../services/projectService.js";

export const createProject = async (req, res) => {
  try {

    const { teamId } = req.params
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      })
    }

    const project = await createProjectService({
      teamId,
      name,
      description,
      createdBy: req.user.id
    })

    return res.status(201).json({
      success: true,
      message: "Porject created successfully",
      date: {
        project,
      }
    })
  }
  catch (error) {

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    })

  }
}

export const getTeamProjects = async (req, res) => {
  try {
    const { teamId } = req.params;

    const projects = await getTeamProjectsService(teamId);

    return res.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProjectByIdService({
      projectId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const { name, description, status } = req.body;

    if (
      name === undefined &&
      description === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update the project",
      });
    }

    const project = await updateProjectService({
      projectId,
      userId: req.user.id,
      name,
      description,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const archiveProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await archiveProjectService({
      projectId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Project archived successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};