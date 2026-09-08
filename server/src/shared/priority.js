function priorityFromSupporterCount(value) {
  const count = Math.max(0, Number(value) || 0);
  if (count >= 10) return "urgent";
  if (count >= 5) return "high";
  if (count >= 2) return "medium";
  return "low";
}

export {
  priorityFromSupporterCount
};
