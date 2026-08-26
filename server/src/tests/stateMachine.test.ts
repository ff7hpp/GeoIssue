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

  it('should allow skipping transitions', () => {
    expect(isValidStatusTransition('submitted', 'resolved')).toBe(true);
    expect(isValidStatusTransition('submitted', 'in_progress')).toBe(true);
    expect(isValidStatusTransition('submitted', 'rejected')).toBe(true);
  });

  it('should allow transitions out of terminal states in MVP', () => {
    expect(isValidStatusTransition('resolved', 'in_progress')).toBe(true);
    expect(isValidStatusTransition('rejected', 'submitted')).toBe(true);
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
