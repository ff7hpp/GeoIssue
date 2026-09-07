import { issuesService } from "./issues.service.js";
import { reportsRepository } from "../reports/reports.repository.js";
import { PUBLIC_ISSUE_STATUSES } from "../../shared/stateMachine.js";
import { AppError } from "../../shared/errors.js";
function sanitizeIssueForPublic(issue) {
  const { assigned_to, deleted_at, assignee, history, ...publicIssue } = issue;
  return {
    ...publicIssue,
    assignee: assignee ? { display_name: assignee.display_name || "Municipal staff" } : null,
    ...history ? {
      history: history.map((entry) => {
        const { changed_by_user_id, changed_by, ...publicEntry } = entry;
        return {
          ...publicEntry,
          changed_by: changed_by ? {
            display_name: changed_by.role === "admin" ? "Administrator" : "Citizen",
            role: changed_by.role
          } : void 0
        };
      })
    } : {}
  };
}
const issuesController = {
  async list(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const status = req.query.status;
      const categoryId = req.query.category_id;
      const search = req.query.search;
      const { issues, total } = await issuesService.listIssues({
        page,
        limit,
        status,
        categoryId,
        search
      });
      res.json({
        data: issues.map(sanitizeIssueForPublic),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const currentUserId = req.user?.id;
      const issueId = req.params.id;
      const issue = await issuesService.getIssueById(issueId, currentUserId);
      const reports = await reportsRepository.findByIssueId(issueId);
      const isAdmin = req.user?.role === "admin";
      const isReporter = reports.some((report) => report.user_id === req.user?.id);
      if (!PUBLIC_ISSUE_STATUSES.includes(issue.status) && !isAdmin && !isReporter) {
        throw AppError.notFound("Issue not found");
      }
      const sanitizedReports = reports.map((report) => {
        if (isAdmin) return report;
        const { user_id, deleted_at, user, ...publicReport } = report;
        return {
          ...publicReport,
          user: { display_name: "Citizen" }
        };
      });
      res.json({
        data: {
          ...isAdmin ? issue : sanitizeIssueForPublic(issue),
          reports: sanitizedReports
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
export {
  issuesController
};
