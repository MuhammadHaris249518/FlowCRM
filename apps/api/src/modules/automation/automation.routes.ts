import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { automationController } from "./automation.controller";

export const automationRouter = Router();

automationRouter.use(requireAuth());

// Workflows are an org-wide configuration surface, not a per-rep-scoped
// record like Leads/Deals/Tasks — every role may VIEW automations (a rep
// should be able to see what's running against their leads), but only
// managers/owners may author them. Same reassignment-restriction precedent
// as leads.service.ts / pipeline.service.ts / tasks.service.ts, applied at
// the route layer here because there's no per-row ownership to fall back on.
const CAN_EDIT_WORKFLOWS = ["ORG_OWNER", "SALES_MANAGER", "SUPER_ADMIN"] as const;

automationRouter.get("/", asyncHandler(automationController.list));
automationRouter.get("/:id", asyncHandler(automationController.getById));
automationRouter.post("/", requireRole([...CAN_EDIT_WORKFLOWS]), asyncHandler(automationController.create));
automationRouter.patch("/:id", requireRole([...CAN_EDIT_WORKFLOWS]), asyncHandler(automationController.update));
automationRouter.delete("/:id", requireRole([...CAN_EDIT_WORKFLOWS]), asyncHandler(automationController.delete));

