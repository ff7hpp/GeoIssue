import { databaseConfigured, sql } from "../db.js";
import { getNextId, issues } from "../data/issues.js";

const issueColumns = `
  id, title, description, category, status, reporter,
  latitude, longitude, created_by AS "createdBy",
  created_at::date::text AS "createdAt"
`;

export async function listIssues() {
  if (!databaseConfigured) return issues;

  return sql.query(`SELECT ${issueColumns} FROM issues ORDER BY created_at DESC, id DESC`);
}

export async function findIssue(id) {
  if (!databaseConfigured) {
    return issues.find((issue) => issue.id === Number(id)) || null;
  }

  const rows = await sql.query(`SELECT ${issueColumns} FROM issues WHERE id = $1`, [Number(id)]);
  return rows[0] || null;
}

export async function createIssue(data) {
  if (!databaseConfigured) {
    const issue = { id: getNextId(), ...data, createdAt: new Date().toISOString().slice(0, 10) };
    issues.unshift(issue);
    return issue;
  }

  const rows = await sql`
    INSERT INTO issues (title, description, category, status, reporter, latitude, longitude, created_by)
    VALUES (${data.title}, ${data.description}, ${data.category}, ${data.status}, ${data.reporter}, ${data.latitude}, ${data.longitude}, ${data.createdBy})
    RETURNING id, title, description, category, status, reporter, latitude, longitude,
      created_by AS "createdBy", created_at::date::text AS "createdAt"
  `;
  return rows[0];
}

export async function updateIssue(id, data) {
  if (!databaseConfigured) {
    const issue = await findIssue(id);
    if (!issue) return null;
    Object.assign(issue, data);
    return issue;
  }

  const rows = await sql`
    UPDATE issues
    SET title = ${data.title}, description = ${data.description}, category = ${data.category},
      latitude = ${data.latitude}, longitude = ${data.longitude}, updated_at = NOW()
    WHERE id = ${Number(id)}
    RETURNING id, title, description, category, status, reporter, latitude, longitude,
      created_by AS "createdBy", created_at::date::text AS "createdAt"
  `;
  return rows[0] || null;
}

export async function updateIssueStatus(id, status) {
  if (!databaseConfigured) {
    const issue = await findIssue(id);
    if (!issue) return null;
    issue.status = status;
    return issue;
  }

  const rows = await sql`
    UPDATE issues SET status = ${status}, updated_at = NOW()
    WHERE id = ${Number(id)}
    RETURNING id, title, description, category, status, reporter, latitude, longitude,
      created_by AS "createdBy", created_at::date::text AS "createdAt"
  `;
  return rows[0] || null;
}

export async function deleteIssue(id) {
  if (!databaseConfigured) {
    const index = issues.findIndex((issue) => issue.id === Number(id));
    if (index === -1) return null;
    return issues.splice(index, 1)[0];
  }

  const rows = await sql`DELETE FROM issues WHERE id = ${Number(id)} RETURNING id`;
  return rows[0] || null;
}
