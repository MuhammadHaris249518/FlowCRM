import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { pipelineController } from "./pipeline.controller";

export const pipelineRouter = Router();

pipelineRouter.use(requireAuth());

pipelineRouter.get("/board", asyncHandler(pipelineController.board));
pipelineRouter.get("/deals", asyncHandler(pipelineController.list));
pipelineRouter.post("/deals", asyncHandler(pipelineController.create));
pipelineRouter.get("/deals/:id", asyncHandler(pipelineController.getById));
pipelineRouter.patch("/deals/:id", asyncHandler(pipelineController.update));
pipelineRouter.patch("/deals/:id/stage", asyncHandler(pipelineController.updateStage));
pipelineRouter.delete("/deals/:id", asyncHandler(pipelineController.delete));
