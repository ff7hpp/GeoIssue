import { issuesRepository } from './issues.repository.js';
import { supportRepository } from '../support/support.repository.js';
import { AppError } from '../../shared/errors.js';
import { IssuePriority, IssueStatus } from '../../shared/types.js';
import { isValidStatusTransition } from '../../shared/stateMachine.js';

export const issuesService = {
  async listIssues(filters: {
    status?: IssueStatus;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return issuesRepository.list(filters);
  },

  async getIssueById(id: string, currentUserId?: string) {
    const issue = await issuesRepository.findById(id);
    if (!issue) {
      throw AppError.notFound('Issue not found');
    }

    let hasSupported = false;
    if (currentUserId) {
      hasSupported = await supportRepository.hasUserSupported(id, currentUserId);
    }

    const history = await issuesRepository.getStatusHistory(id);

    return {
      ...issue,
      has_supported: hasSupported,
      history,
    };
  },

  async updateIssueStatus(
    id: string,
    toStatus: IssueStatus,
    adminUserId: string,
    note?: string
  ) {
    const issue = await issuesRepository.findById(id);
    if (!issue) {
      throw AppError.notFound('Issue not found');
    }

    if (!isValidStatusTransition(issue.status, toStatus)) {
      throw AppError.badRequest(
        `Invalid status transition from "${issue.status}" to "${toStatus}". Allowed next statuses are governed by the lifecycle state machine.`
      );
    }

    const updateData: any = { status: toStatus };
    if (toStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const updatedIssue = await issuesRepository.update(id, updateData);

    // Record in history
    await issuesRepository.addStatusHistory({
      issue_id: id,
      changed_by_user_id: adminUserId,
      from_status: issue.status,
      to_status: toStatus,
      note: note || null,
    });

    return updatedIssue;
  },

  async updateIssuePriority(id: string, priority: IssuePriority) {
    const issue = await issuesRepository.findById(id);
    if (!issue) {
      throw AppError.notFound('Issue not found');
    }

    return issuesRepository.update(id, { priority });
  },
};
