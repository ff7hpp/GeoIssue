import express from "express";
import { getNextId, issues } from "../data/issues.js";

const router = express.Router();
const statuses = ["Pending", "In Progress", "Resolved"];

function findIssue(id) {
  return issues.find((issue) => issue.id === Number(id));
}

function readIssue(body) {
  const title = body.title?.trim();
  const description = body.description?.trim();
  const category = body.category?.trim();
  const reporter = body.reporter?.trim() || "Anonymous";
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!title || !description || !category || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return { title, description, category, reporter, latitude, longitude };
}

router.get("/", (_req, res) => {
  res.json({ issues });
});

router.post("/", (req, res) => {
  const issueData = readIssue(req.body);

  if (!issueData) {
    return res.status(400).json({ message: "Title, description, category, and coordinates are required." });
  }

  const issue = {
    id: getNextId(),
    ...issueData,
    status: "Pending",
    createdAt: new Date().toISOString().slice(0, 10),
  };

  issues.unshift(issue);
  return res.status(201).json({ issue });
});

router.put("/:id", (req, res) => {
  const issue = findIssue(req.params.id);
  const issueData = readIssue(req.body);

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!issueData) {
    return res.status(400).json({ message: "Title, description, category, and coordinates are required." });
  }

  Object.assign(issue, issueData);
  return res.json({ issue });
});

router.patch("/:id/status", (req, res) => {
  const issue = findIssue(req.params.id);
  const { status } = req.body;

  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  if (!statuses.includes(status)) {
    return res.status(400).json({ message: "Status must be Pending, In Progress, or Resolved." });
  }

  issue.status = status;
  return res.json({ issue });
});

router.delete("/:id", (req, res) => {
  const index = issues.findIndex((issue) => issue.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Issue not found." });
  }

  issues.splice(index, 1);
  return res.status(204).send();
});

export default router;
