import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { communicationService } from "./communication.service";
import { listThreadQuerySchema } from "./communication.validation";

export const communicationController = {
  async listThread(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = listThreadQuerySchema.parse(req.query);
    const data = await communicationService.listThread(
      req.authContext,
      { contactId: query.contactId, leadId: query.leadId },
      query.limit
    );
    res.json({ success: true, data });
  },

  async sendDraft(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await communicationService.sendDraft(req.authContext, req.params.id);
    res.json({ success: true, data });
  },
};
