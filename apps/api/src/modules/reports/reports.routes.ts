import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { reportsController } from "./reports.controller";

export const reportsRouter = Router();

// Same as dashboard — every role can view reports, RBAC scoping happens
// inside the repository, not via requireRole().
reportsRouter.use(requireAuth());

reportsRouter.get(
  "/conversion-funnel",
  asyncHandler(reportsController.getConversionFunnel)
);

reportsRouter.get(
  "/win-loss",
  asyncHandler(reportsController.getWinLossReport)
);

reportsRouter.get(
  "/trends",
  asyncHandler(reportsController.getTrends)
);
