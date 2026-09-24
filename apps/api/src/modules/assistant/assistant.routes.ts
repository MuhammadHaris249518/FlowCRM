import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { assistantController } from "./assistant.controller";

export const assistantRouter = Router();

assistantRouter.use(requireAuth());
assistantRouter.post("/chat", asyncHandler(assistantController.chat));
