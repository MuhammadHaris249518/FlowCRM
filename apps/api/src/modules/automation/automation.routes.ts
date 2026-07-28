import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { automationController } from "./automation.controller";

export const automationRouter = Router();

automationRouter.use(requireAuth());

automationRouter.get("/", asyncHandler(automationController.list));
automationRouter.post("/", asyncHandler(automationController.create));
automationRouter.get("/:id", asyncHandler(automationController.getById));
automationRouter.patch("/:id", asyncHandler(automationController.update));
automationRouter.delete("/:id", asyncHandler(automationController.delete));
