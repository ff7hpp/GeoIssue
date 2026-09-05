import { issuesService } from "../issues/issues.service.js";
import { issuesRepository } from "../issues/issues.repository.js";
import { usersService } from "../users/users.service.js";
import { categoriesService } from "../categories/categories.service.js";
const adminService = {
  async listAllIssues(filters) {
    return issuesRepository.list(filters);
  },
  async updateIssueStatus(issueId, status, adminUserId, note) {
    return issuesService.updateIssueStatus(issueId, status, adminUserId, note);
  },
  async updateIssuePriority(issueId, priority) {
    return issuesService.updateIssuePriority(issueId, priority);
  },
  async assignIssue(issueId, assigneeId) {
    return issuesRepository.assignIssue(issueId, assigneeId);
  },
  async listAllUsers(page = 1, limit = 20) {
    return usersService.listAllUsers(page, limit);
  },
  async updateUser(userId, data) {
    return usersService.updateUserRoleOrStatus(userId, data);
  },
  async createCategory(data) {
    return categoriesService.createCategory(data);
  },
  async updateCategory(categoryId, data) {
    return categoriesService.updateCategory(categoryId, data);
  }
};
export {
  adminService
};
