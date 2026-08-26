import { commentsRepository } from './comments.repository.js';
import { issuesRepository } from '../issues/issues.repository.js';
import { AppError } from '../../shared/errors.js';
import { DbComment, UserRole } from '../../shared/types.js';

export const commentsService = {
  async getCommentsByIssue(issueId: string): Promise<DbComment[]> {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) {
      throw AppError.notFound('Issue not found');
    }
    return commentsRepository.findByIssueId(issueId);
  },

  async addComment(
    issueId: string,
    userId: string,
    userRole: UserRole,
    content: string
  ): Promise<DbComment> {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) {
      throw AppError.notFound('Issue not found');
    }

    const isOfficial = userRole === 'admin';

    return commentsRepository.create({
      issue_id: issueId,
      user_id: userId,
      content: content.trim(),
      is_official: isOfficial,
    });
  },

  async deleteComment(
    commentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const comment = await commentsRepository.findById(commentId);
    if (!comment) {
      throw AppError.notFound('Comment not found');
    }

    // Only owner or admin can delete
    if (comment.user_id !== userId && userRole !== 'admin') {
      throw AppError.forbidden('You do not have permission to delete this comment');
    }

    await commentsRepository.delete(commentId);
  },
};
