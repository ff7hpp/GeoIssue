const ALLOWED_STATUS_TRANSITIONS = {
  submitted: ["in_review", "accepted", "in_progress", "resolved", "rejected"],
  in_review: ["accepted", "rejected", "in_progress", "resolved"],
  accepted: ["in_progress", "resolved", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: ["in_progress"],
  rejected: ["submitted"]
};
const ACTIVE_ISSUE_STATUSES = [
  "submitted",
  "in_review",
  "accepted",
  "in_progress"
];
function isValidStatusTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}
function isIssueActive(status) {
  return ACTIVE_ISSUE_STATUSES.includes(status);
}
export {
  ACTIVE_ISSUE_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  isIssueActive,
  isValidStatusTransition
};
