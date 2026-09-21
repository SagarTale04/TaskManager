export const errorHandler = (error, req, res, next) => {
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Not allowed by CORS",
    });
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
};