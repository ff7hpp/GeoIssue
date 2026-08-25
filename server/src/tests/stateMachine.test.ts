import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  isIssueActive,
  ALLOWED_STATUS_TRANSITIONS,
} from '../shared/stateMachine.js';
import { IssueStatus } from '../shared/types.js';

describe('Issue State Machine Lifecycle', () => {
  it('should allow valid happy path status progression', () => {
    expect(isValidStatusTransition('submitted', 'in_review')).toBe(true);
    expect(isValidStatusTransition('in_review', 'accepted')).toBe(true);
    expect(isValidStatusTransition('accepted', 'in_progress')).toBe(true);
    expect(isValidStatusTransition('in_progress', 'resolved')).toBe(true);
  });

  it('should allow in_review to rejected transition', () => {
    expect(isValidStatusTransition('in_review', 'rejected')).toBe(true);
  });

  it('should forbid illegal skipping transitions', () => {
    // Cannot skip straight from submitted to resolved
    expect(isValidStatusTransition('submitted', 'resolved')).toBe(false);
    // Cannot skip straight from submitted to in_progress
    expect(isValidStatusTransition('submitted', 'in_progress')).toBe(false);
    // Cannot transition directly from submitted to rejected without review
    expect(isValidStatusTransition('submitted', 'rejected')).toBe(false);
  });

  it('should forbid transitions out of terminal states in MVP', () => {
    const allStatuses: IssueStatus[] = [
      'submitted',
      'in_review',
      'accepted',
      'in_progress',
      'resolved',
      'rejected',
    ];

    for (const target of allStatuses) {
      expect(isValidStatusTransition('resolved', target)).toBe(false);
      expect(isValidStatusTransition('rejected', target)).toBe(false);
    }
  });

  it('should correctly identify active vs closed issues', () => {
    expect(isIssueActive('submitted')).toBe(true);
    expect(isIssueActive('in_review')).toBe(true);
    expect(isIssueActive('accepted')).toBe(true);
    expect(isIssueActive('in_progress')).toBe(true);
    expect(isIssueActive('resolved')).toBe(false);
    expect(isIssueActive('rejected')).toBe(false);
  });
});
