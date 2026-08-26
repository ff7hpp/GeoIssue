import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors.js';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields,
      },
    });
  }

  // Handle generic / unexpected error
  console.error(`[${req.method} ${req.originalUrl}] Unhandled Error:`, err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred',
    },
  });
}
