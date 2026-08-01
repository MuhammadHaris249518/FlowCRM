import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { dashboardController } from "./dashboard.controller";

export const dashboardRouter = Router();

// All dashboard routes require an authenticated, org-scoped session.
// No requireRole() call here — every role (Rep/Manager/Owner) can view the
// dashboard, they just see different scopes (enforced in the repository).
dashboardRouter.use(requireAuth());

dashboardRouter.get("/summary", asyncHandler(dashboardController.getSummary));
dashboardRouter.get(
  "/pipeline-overview",
  asyncHandler(dashboardController.getPipelineOverview)
);
dashboardRouter.get(
  "/recent-activities",
  asyncHandler(dashboardController.getRecentActivities)
);
