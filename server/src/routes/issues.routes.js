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

function readIssue(body) {
  const title = body.title?.trim();
  const description = body.description?.trim();
  const category = body.category?.trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!title || !description || !category || Number.isNaN(latitude) || Number.isNaN(longitude)) {
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
  const issue = await findIssue(req.params.id);
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

  return res.json({ issue: await updateIssue(req.params.id, issueData) });
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const issue = await findIssue(req.params.id);
  const { status } = req.body;

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!canManageIssue(req.user, issue)) {
    return res.status(403).json({ message: "You cannot change this report." });
  }

  if (!statuses.includes(status)) {
    return res.status(400).json({ message: "Status must be Pending, In Progress, or Resolved." });
  }

  return res.json({ issue: await updateIssueStatus(req.params.id, status) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const issue = await findIssue(req.params.id);

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!canManageIssue(req.user, issue)) {
    return res.status(403).json({ message: "You can only remove your own reports." });
  }

  await deleteIssue(req.params.id);
  return res.status(204).send();
});

export default router;
