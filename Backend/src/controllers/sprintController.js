import {
  createSprintService,
  getProjectSprintsService,
  getSprintByIdService,
  updateSprintService,
} from "../services/sprintService.js";

export const createSprint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Sprint name is required",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const sprint = await createSprintService({
      projectId,
      userId: req.user.id,
      name,
      goal,
      startDate,
      endDate,
    });

    return res.status(201).json({
      success: true,
      message: "Sprint created successfully",
      data: {
        sprint,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectSprints = async (req, res) => {
  try {
    const { projectId } = req.params;

    const sprints = await getProjectSprintsService({
      projectId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        sprints,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSprintById = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await getSprintByIdService({
      sprintId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        sprint,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSprint = async (req, res) => {
  try {
    const { sprintId } = req.params;
    const { name, goal, startDate, endDate, status } = req.body;

    if (
      name === undefined &&
      goal === undefined &&
      startDate === undefined &&
      endDate === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update the sprint",
      });
    }

    const sprint = await updateSprintService({
      sprintId,
      userId: req.user.id,
      name,
      goal,
      startDate,
      endDate,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Sprint updated successfully",
      data: {
        sprint,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
