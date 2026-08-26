import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../shared/errors.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        err.errors.forEach((e) => {
          const fieldPath = e.path.join('.');
          fields[fieldPath] = e.message;
        });
        return next(AppError.badRequest('Validation failed', fields));
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        err.errors.forEach((e) => {
          const fieldPath = e.path.join('.');
          fields[fieldPath] = e.message;
        });
        return next(AppError.badRequest('Query validation failed', fields));
      }
      next(err);
    }
  };
}
