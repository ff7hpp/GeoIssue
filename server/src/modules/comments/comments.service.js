import { commentsRepository } from "./comments.repository.js";
import { issuesRepository } from "../issues/issues.repository.js";
import { AppError } from "../../shared/errors.js";
const commentsService = {
  async getCommentsByIssue(issueId) {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) {
      throw AppError.notFound("Issue not found");
    }
    return commentsRepository.findByIssueId(issueId);
  },
  async addComment(issueId, userId, userRole, content) {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) {
      throw AppError.notFound("Issue not found");
    }
    const isOfficial = userRole === "admin";
    return commentsRepository.create({
      issue_id: issueId,
      user_id: userId,
      content: content.trim(),
      is_official: isOfficial
    });
  },
  async deleteComment(commentId, userId, userRole) {
    const comment = await commentsRepository.findById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found");
    }
    if (comment.user_id !== userId && userRole !== "admin") {
      throw AppError.forbidden("You do not have permission to delete this comment");
    }
    await commentsRepository.delete(commentId);
  }
};
export {
  commentsService
};
