import { supportService } from "./support.service.js";
const supportController = {
  async addSupport(req, res, next) {
    try {
      const userId = req.user.id;
      const issueId = req.params.id;
      const result = await supportService.supportIssue(issueId, userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
  async removeSupport(req, res, next) {
    try {
      const userId = req.user.id;
      const issueId = req.params.id;
      const result = await supportService.unsupportIssue(issueId, userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
};
export {
  supportController
};
