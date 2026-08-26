import { IssueStatus } from './types.js';

export const ALLOWED_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  submitted: ['in_review', 'accepted', 'in_progress', 'resolved', 'rejected'],
  in_review: ['accepted', 'rejected', 'in_progress', 'resolved'],
  accepted: ['in_progress', 'resolved', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['in_progress'],
  rejected: ['submitted'],
};

export const ACTIVE_ISSUE_STATUSES: IssueStatus[] = [
  'submitted',
  'in_review',
  'accepted',
  'in_progress',
];

export function isValidStatusTransition(
  currentStatus: IssueStatus,
  targetStatus: IssueStatus
): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export function isIssueActive(status: IssueStatus): boolean {
  return ACTIVE_ISSUE_STATUSES.includes(status);
}
