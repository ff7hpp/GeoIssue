import { issuesService } from '../issues/issues.service.js';
import { issuesRepository } from '../issues/issues.repository.js';
import { usersService } from '../users/users.service.js';
import { categoriesService } from '../categories/categories.service.js';
import { IssuePriority, IssueStatus, UserRole } from '../../shared/types.js';

export const adminService = {
  async listAllIssues(filters: {
    status?: IssueStatus;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return issuesRepository.list(filters);
  },

  async updateIssueStatus(
    issueId: string,
    status: IssueStatus,
    adminUserId: string,
    note?: string
  ) {
    return issuesService.updateIssueStatus(issueId, status, adminUserId, note);
  },

  async updateIssuePriority(issueId: string, priority: IssuePriority) {
    return issuesService.updateIssuePriority(issueId, priority);
  },

  async assignIssue(issueId: string, assigneeId: string | null) {
    // Optionally validate that assigneeId is a valid user with 'admin' role
    return issuesRepository.assignIssue(issueId, assigneeId);
  },

  async listAllUsers(page = 1, limit = 20) {
    return usersService.listAllUsers(page, limit);
  },

  async updateUser(
    userId: string,
    data: { role?: UserRole; account_status?: any }
  ) {
    return usersService.updateUserRoleOrStatus(userId, data);
  },

  async createCategory(data: { name: string; slug: string; icon: string }) {
    return categoriesService.createCategory(data);
  },

  async updateCategory(
    categoryId: string,
    data: { name?: string; slug?: string; icon?: string; is_active?: boolean }
  ) {
    return categoriesService.updateCategory(categoryId, data);
  },
};
