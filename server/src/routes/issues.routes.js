import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createIssue,
  deleteIssue,
  findIssue,
  listIssues,
  updateIssue,
  updateIssueStatus,
} from "../repositories/issue.repository.js";

const router = express.Router();
const statuses = ["Pending", "In Progress", "Resolved"];
const categories = ["Road", "Water", "Electricity", "Traffic", "Environment", "Other"];

function readIssueId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function readIssue(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (
    !title || title.length > 160 ||
    !description || description.length > 3000 ||
    !categories.includes(category) ||
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return null;
  }

  return { title, description, category, latitude, longitude };
}

function canManageIssue(user, issue) {
  return issue.createdBy === user.uid;
}

router.get("/", async (_req, res) => {
  res.json({ issues: await listIssues() });
});

router.post("/", requireAuth, async (req, res) => {
  const issueData = readIssue(req.body);

  if (!issueData) {
    return res.status(400).json({ message: "Title, description, category, and coordinates are required." });
  }

  const issue = await createIssue({
    ...issueData,
    status: "Pending",
    reporter: req.user.name || req.user.email || "Firebase user",
    createdBy: req.user.uid,
  });

  return res.status(201).json({ issue });
});

router.put("/:id", requireAuth, async (req, res) => {
  const issueId = readIssueId(req.params.id);
  if (!issueId) return res.status(400).json({ message: "A valid issue ID is required." });

  const issue = await findIssue(issueId);
  const issueData = readIssue(req.body);

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!canManageIssue(req.user, issue)) {
    return res.status(403).json({ message: "You can only edit your own reports." });
  }

  if (!issueData) {
    return res.status(400).json({ message: "Title, description, category, and coordinates are required." });
  }

  return res.json({ issue: await updateIssue(issueId, issueData) });
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const issueId = readIssueId(req.params.id);
  if (!issueId) return res.status(400).json({ message: "A valid issue ID is required." });

  const issue = await findIssue(issueId);
  const status = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body.status
    : null;

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!canManageIssue(req.user, issue)) {
    return res.status(403).json({ message: "You cannot change this report." });
  }

  if (!statuses.includes(status)) {
    return res.status(400).json({ message: "Status must be Pending, In Progress, or Resolved." });
  }

  return res.json({ issue: await updateIssueStatus(issueId, status) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const issueId = readIssueId(req.params.id);
  if (!issueId) return res.status(400).json({ message: "A valid issue ID is required." });

  const issue = await findIssue(issueId);

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!canManageIssue(req.user, issue)) {
    return res.status(403).json({ message: "You can only remove your own reports." });
  }

  await deleteIssue(issueId);
  return res.status(204).send();
});

export default router;
