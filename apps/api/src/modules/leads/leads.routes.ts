import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { leadsController } from "./leads.controller";

export const leadsRouter = Router();

leadsRouter.use(requireAuth());

leadsRouter.get("/", asyncHandler(leadsController.list));
leadsRouter.post("/", asyncHandler(leadsController.create));
leadsRouter.get("/:id", asyncHandler(leadsController.getById));
leadsRouter.patch("/:id", asyncHandler(leadsController.update));
leadsRouter.delete("/:id", asyncHandler(leadsController.delete));
leadsRouter.post("/:id/convert", asyncHandler(leadsController.convert));
