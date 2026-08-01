import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { leadsService } from "./leads.service";
import { createLeadSchema, leadQuerySchema, updateLeadSchema, convertLeadSchema } from "./leads.validation";

export const leadsController = {
  async list(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = leadQuerySchema.parse(req.query);
    const data = await leadsService.list(req.authContext, query);
    res.json({ success: true, data });
  },

  async getById(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await leadsService.getById(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = createLeadSchema.parse(req.body);
    const data = await leadsService.create(req.authContext, input);
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateLeadSchema.parse(req.body);
    const data = await leadsService.update(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async delete(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await leadsService.delete(req.authContext, req.params.id);
    res.status(204).send();
  },

  async scoreWithAi(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await leadsService.scoreWithAi(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async convert(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = convertLeadSchema.parse(req.body);
    const data = await leadsService.convert(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },
};
