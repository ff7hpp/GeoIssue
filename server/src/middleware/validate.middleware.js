import { ZodError } from "zod";
import { AppError } from "../shared/errors.js";
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields = {};
        err.errors.forEach((e) => {
          const fieldPath = e.path.join(".");
          fields[fieldPath] = e.message;
        });
        return next(AppError.badRequest("Validation failed", fields));
      }
      next(err);
    }
  };
}
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields = {};
        err.errors.forEach((e) => {
          const fieldPath = e.path.join(".");
          fields[fieldPath] = e.message;
        });
        return next(AppError.badRequest("Query validation failed", fields));
      }
      next(err);
    }
  };
}
export {
  validateBody,
  validateQuery
};
