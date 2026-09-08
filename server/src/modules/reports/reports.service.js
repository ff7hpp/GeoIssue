import { reportsRepository } from "./reports.repository.js";
import { issuesRepository } from "../issues/issues.repository.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import { AppError } from "../../shared/errors.js";
import { config } from "../../config/env.js";
const reportsService = {
  async createReport(userId, data) {
    const category = await categoriesRepository.findById(data.category_id);
    if (!category || !category.is_active) {
      throw AppError.badRequest("Valid active category is required");
    }
    const radius = config.matchRadiusMeters;
    const candidates = await issuesRepository.findNearbyActiveCandidates(
      data.category_id,
      data.latitude,
      data.longitude,
      radius
    );
    let targetIssueId;
    let isNewIssue = false;
    let distanceToIssue = 0;
    if (candidates.length > 0) {
      const nearest = candidates[0];
      targetIssueId = nearest.id;
      distanceToIssue = nearest.distance;
      await issuesRepository.incrementReportCount(targetIssueId);
    } else {
      isNewIssue = true;
      const title = data.title?.trim() || `${category.name} report near [${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]`;
      const newIssue = await issuesRepository.create({
        category_id: data.category_id,
        title,
        summary: data.description.slice(0, 200),
        latitude: data.latitude,
        longitude: data.longitude,
        status: "submitted",
        priority: "low"
      });
      targetIssueId = newIssue.id;
      await issuesRepository.addStatusHistory({
        issue_id: targetIssueId,
        changed_by_user_id: userId,
        from_status: null,
        to_status: "submitted",
        note: "Issue created from citizen report."
      });
    }
    const report = await reportsRepository.create({
      issue_id: targetIssueId,
      user_id: userId,
      category_id: data.category_id,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      image_url: data.image_url || null
    });
    return {
      report,
      matched_issue_id: targetIssueId,
      is_new_issue: isNewIssue,
      distance_meters: Math.round(distanceToIssue)
    };
  },
  async getMyReports(userId, page = 1, limit = 20) {
    return reportsRepository.findByUserId(userId, page, limit);
  },
  async getReportById(id) {
    const report = await reportsRepository.findById(id);
    if (!report) {
      throw AppError.notFound("Report not found");
    }
    return report;
  },
  async updateReport(id, userId, userRole, data) {
    const report = await reportsRepository.findById(id);
    if (!report) {
      throw AppError.notFound("Report not found");
    }
    if (report.user_id !== userId && userRole !== "admin") {
      throw AppError.forbidden("You can only modify your own reports");
    }
    return reportsRepository.update(id, data);
  },
  async deleteReport(id, userId, userRole) {
    const report = await reportsRepository.findById(id);
    if (!report) {
      throw AppError.notFound("Report not found");
    }
    if (report.user_id !== userId && userRole !== "admin") {
      throw AppError.forbidden("You can only delete your own reports");
    }
    return reportsRepository.delete(id);
  }
};
export {
  reportsService
};
