import {
  createCommentService,
  getTaskCommentsService,
  updateCommentService,
  deleteCommentService,
} from "../services/commentService.js";

export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const comment = await createCommentService({
      taskId,
      userId: req.user.id,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await getTaskCommentsService({
      taskId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        comments,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await updateCommentService({
      commentId,
      userId: req.user.id,
      content,
    });

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    await deleteCommentService({
      commentId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
