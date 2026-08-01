import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { automationService } from "./automation.service";
import { createWorkflowSchema, updateWorkflowSchema, paginationQuerySchema } from "./automation.validation";

export const automationController = {
  async list(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = paginationQuerySchema.parse(req.query);
    const data = await automationService.list(req.authContext, query);
    res.json({ success: true, data });
  },

  async getById(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await automationService.getById(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = createWorkflowSchema.parse(req.body);
    const data = await automationService.create(req.authContext, input);
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateWorkflowSchema.parse(req.body);
    const data = await automationService.update(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async delete(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await automationService.delete(req.authContext, req.params.id);
    res.status(204).send();
  },
};
