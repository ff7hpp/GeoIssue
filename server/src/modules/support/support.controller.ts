import { Request, Response, NextFunction } from 'express';
import { supportService } from './support.service.js';

export const supportController = {
  async addSupport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const issueId = req.params.id as string;
      const result = await supportService.supportIssue(issueId, userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async removeSupport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const issueId = req.params.id as string;
      const result = await supportService.unsupportIssue(issueId, userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
};
