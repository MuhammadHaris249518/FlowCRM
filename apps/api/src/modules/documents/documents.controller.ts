import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { documentsService } from "./documents.service";
import { listDocumentsQuerySchema } from "./documents.validation";

export const documentsController = {
  async list(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = listDocumentsQuerySchema.parse(req.query);
    const data = await documentsService.list(req.authContext, {
      contactId: query.contactId,
      leadId: query.leadId,
      dealId: query.dealId,
      libraryOnly: query.library,
    });
    res.json({ success: true, data });
  },

  async upload(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    if (!req.file) throw AppError.badRequest("No file uploaded", "NO_FILE");

    const data = await documentsService.upload(req.authContext, req.file, {
      contactId: (req.body.contactId as string) || null,
      leadId: (req.body.leadId as string) || null,
      dealId: (req.body.dealId as string) || null,
    });
    res.status(201).json({ success: true, data });
  },

  async getDownloadUrl(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const url = await documentsService.getDownloadUrl(req.authContext, req.params.id);
    res.json({ success: true, data: { url } });
  },

  async delete(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await documentsService.delete(req.authContext, req.params.id);
    res.status(204).send();
  },
};
