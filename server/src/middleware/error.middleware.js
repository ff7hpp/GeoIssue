import { AppError } from "../shared/errors.js";
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields
      }
    });
  }
  console.error(`[${req.method} ${req.originalUrl}] Unhandled Error:`, err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected internal server error occurred"
    }
  });
}
export {
  errorHandler
};
