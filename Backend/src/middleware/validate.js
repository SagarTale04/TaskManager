/**
 * Reusable Zod validation middleware for Express.
 * Validates request data and returns uniform HTTP 400 on error.
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (
        schema.shape &&
        (schema.shape.body || schema.shape.params || schema.shape.query)
      ) {
        const parsed = await schema.parseAsync({
          body: req.body,
          params: req.params,
          query: req.query,
        });

        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.params !== undefined) req.params = parsed.params;
        if (parsed.query !== undefined) req.query = parsed.query;
      } else {
        req.body = await schema.parseAsync(req.body);
      }

      next();
    } catch (error) {
      const issues = error.issues || error.errors;

      if (error.name === "ZodError" || issues) {
        const firstError = issues?.[0]?.message || "Validation failed";

        return res.status(400).json({
          success: false,
          message: firstError,
          errors: (issues || []).map((err) => ({
            field:
              err.path
                .filter((p) => p !== "body" && p !== "params" && p !== "query")
                .join(".") || err.path.join("."),
            message: err.message,
          })),
        });
      }

      next(error);
    }
  };
};

export default validate;
