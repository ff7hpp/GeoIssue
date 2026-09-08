import { supportRepository } from "./support.repository.js";
import { issuesRepository } from "../issues/issues.repository.js";
import { AppError } from "../../shared/errors.js";
import { priorityFromSupporterCount } from "../../shared/priority.js";
const supportService = {
  async supportIssue(issueId, userId) {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) {
      throw AppError.notFound("Issue not found");
    }
    const added = await supportRepository.addSupport(issueId, userId);
    const count = await supportRepository.getSupportersCount(issueId);
    const priority = priorityFromSupporterCount(count);
    await issuesRepository.update(issueId, { priority });
    return {
      supported: true,
      supporter_count: count,
      priority,
      already_supported: !added
    };
  },
  async unsupportIssue(issueId, userId) {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) {
      throw AppError.notFound("Issue not found");
    }
    await supportRepository.removeSupport(issueId, userId);
    const count = await supportRepository.getSupportersCount(issueId);
    const priority = priorityFromSupporterCount(count);
    await issuesRepository.update(issueId, { priority });
    return {
      supported: false,
      supporter_count: count,
      priority
    };
  }
};
export {
  supportService
};
