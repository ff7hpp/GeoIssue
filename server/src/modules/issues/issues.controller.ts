import { Request, Response, NextFunction } from 'express';
import { issuesService } from './issues.service.js';
import { reportsRepository } from '../reports/reports.repository.js';
import { IssueStatus } from '../../shared/types.js';

export const issuesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as IssueStatus | undefined;
      const categoryId = req.query.category_id as string | undefined;
      const search = req.query.search as string | undefined;

      const { issues, total } = await issuesService.listIssues({
        page,
        limit,
        status,
        categoryId,
        search,
      });

      res.json({
        data: issues,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.id;
      const issueId = req.params.id as string;
      const issue = await issuesService.getIssueById(issueId, currentUserId);
      const reports = await reportsRepository.findByIssueId(issueId);

      res.json({
        data: {
          ...issue,
          reports,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
