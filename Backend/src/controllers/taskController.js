import {
  createTaskService,
  getProjectTasksService,
  getSprintTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
} from "../services/taskService.js";

export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      storyPoints,
      assignedTo,
      dueDate,
      sprintId,
    } = req.body;

    const task = await createTaskService({
      projectId,
      userId: req.user.id,
      title,
      description,
      status,
      priority,
      storyPoints,
      assignedTo,
      dueDate,
      sprintId,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const {
      sprintId,
      status,
      priority,
      assignedTo,
      page,
      limit,
    } = req.query;

    const parsedPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 10, 1),
      100
    );

    const result = await getProjectTasksService({
      projectId,
      userId: req.user.id,
      sprintId,
      status,
      priority,
      assignedTo,
      page: parsedPage,
      limit: parsedLimit,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSprintTasks = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const tasks = await getSprintTasksService({
      sprintId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        tasks,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await getTaskByIdService({
      taskId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      storyPoints,
      assignedTo,
      dueDate,
      sprintId,
    } = req.body;

    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      priority === undefined &&
      storyPoints === undefined &&
      assignedTo === undefined &&
      dueDate === undefined &&
      sprintId === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update the task",
      });
    }

    const task = await updateTaskService({
      taskId,
      userId: req.user.id,
      title,
      description,
      status,
      priority,
      storyPoints,
      assignedTo,
      dueDate,
      sprintId,
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    await deleteTaskService({
      taskId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
