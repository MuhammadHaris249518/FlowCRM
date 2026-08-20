import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { communicationController } from "./communication.controller";

export const communicationRouter = Router();

communicationRouter.use(requireAuth());
communicationRouter.get("/messages", asyncHandler(communicationController.listThread));
communicationRouter.post("/messages/:id/send", asyncHandler(communicationController.sendDraft));
