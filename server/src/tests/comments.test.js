import { describe, it, expect, beforeAll } from "vitest";
import { commentsService } from "../modules/comments/comments.service.js";
import { issuesRepository } from "../modules/issues/issues.repository.js";
import { initDb } from "../db/pool.js";
describe("Issue Comments System", () => {
  beforeAll(async () => {
    await initDb();
  });
  it("should validate and create a comment on an existing issue", async () => {
    const { issues } = await issuesRepository.list();
    if (issues.length > 0) {
      const issue = issues[0];
      const comment = await commentsService.addComment(
        issue.id,
        "a1000000-0000-0000-0000-000000000001",
        "user",
        "This is a verified test community observation."
      );
      expect(comment).toBeDefined();
      expect(comment.content).toBe("This is a verified test community observation.");
      expect(comment.is_official).toBe(false);
      const comments = await commentsService.getCommentsByIssue(issue.id);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments.some((c) => c.id === comment.id)).toBe(true);
      await commentsService.deleteComment(
        comment.id,
        "a1000000-0000-0000-0000-000000000001",
        "user"
      );
    }
  });
  it("should mark comments created by admin as official", async () => {
    const { issues } = await issuesRepository.list();
    if (issues.length > 0) {
      const issue = issues[0];
      const comment = await commentsService.addComment(
        issue.id,
        "a1000000-0000-0000-0000-000000000002",
        "admin",
        "Municipal crew has been dispatched to this location."
      );
      expect(comment.is_official).toBe(true);
      await commentsService.deleteComment(
        comment.id,
        "a1000000-0000-0000-0000-000000000002",
        "admin"
      );
    }
  });
  it("should reject deleting a comment by unauthorized user", async () => {
    const { issues } = await issuesRepository.list();
    if (issues.length > 0) {
      const issue = issues[0];
      const comment = await commentsService.addComment(
        issue.id,
        "a1000000-0000-0000-0000-000000000001",
        "user",
        "Comment to test unauthorized delete."
      );
      await expect(
        commentsService.deleteComment(
          comment.id,
          "a1000000-0000-0000-0000-000000000999",
          "user"
        )
      ).rejects.toThrow("You do not have permission");
      await commentsService.deleteComment(
        comment.id,
        "a1000000-0000-0000-0000-000000000002",
        "admin"
      );
    }
  });
});
