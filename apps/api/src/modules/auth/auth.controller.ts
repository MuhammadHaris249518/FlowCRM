import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { AppError } from "../../errors/app-error";
import { authService } from "./auth.service";
import { createOrganizationSchema } from "./auth.validation";

export const authController = {
  async getMe(req: Request, res: Response) {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) throw AppError.unauthorized();
    const data = await authService.getMe(clerkId);
    res.json({ success: true, data });
  },

  async createOrganization(req: Request, res: Response) {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) throw AppError.unauthorized();
    const input = createOrganizationSchema.parse(req.body);
    const data = await authService.createOrganization(clerkId, input);
    res.status(201).json({ success: true, data });
  },
};