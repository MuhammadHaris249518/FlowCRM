import { Router } from "express";
import { requireAuthenticatedClerkSession } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { authController } from "./auth.controller";

export const authRouter = Router();

// Only a valid Clerk session is required here — not yet an org membership,
// since these routes exist precisely to discover/create that org.
authRouter.use(requireAuthenticatedClerkSession());

authRouter.get("/me", asyncHandler(authController.getMe));
authRouter.post("/organizations", asyncHandler(authController.createOrganization));