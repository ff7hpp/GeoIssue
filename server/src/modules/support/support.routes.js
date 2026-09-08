import { Router } from "express";
import { supportService } from "./support.service.js";
import { authenticate } from "../../middleware/auth.middleware.js";
const router = Router({ mergeParams: true });
router.post("/", authenticate, async (req, res, next) => {
  try {
    const result = await supportService.supportIssue(req.params.id, req.user.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
router.delete("/", authenticate, async (req, res, next) => {
  try {
    const result = await supportService.unsupportIssue(req.params.id, req.user.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
