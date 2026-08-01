import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { tasksController } from "./tasks.controller";

export const tasksRouter = Router();

tasksRouter.use(requireAuth());

// /calendar MUST be registered before /:id — otherwise Express matches
// GET /tasks/calendar against the :id param route and "calendar" gets
// treated as a task id (same trap avoided in pipeline.routes.ts with /board).
tasksRouter.get("/calendar", asyncHandler(tasksController.calendar));

tasksRouter.get("/", asyncHandler(tasksController.list));
tasksRouter.post("/", asyncHandler(tasksController.create));
tasksRouter.get("/:id", asyncHandler(tasksController.getById));
tasksRouter.patch("/:id", asyncHandler(tasksController.update));
tasksRouter.patch("/:id/complete", asyncHandler(tasksController.complete));
tasksRouter.patch("/:id/reopen", asyncHandler(tasksController.reopen));
tasksRouter.delete("/:id", asyncHandler(tasksController.delete));
