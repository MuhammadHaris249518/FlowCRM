import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { pipelineService } from "./pipeline.service";
import {
  createDealSchema,
  dealQuerySchema,
  updateDealSchema,
  updateDealStageSchema,
} from "./pipeline.validation";

export const pipelineController = {
  async board(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await pipelineService.board(req.authContext);
    res.json({ success: true, data });
  },

  async list(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = dealQuerySchema.parse(req.query);
    const data = await pipelineService.list(req.authContext, query);
    res.json({ success: true, data });
  },

  async getById(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await pipelineService.getById(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = createDealSchema.parse(req.body);
    const data = await pipelineService.create(req.authContext, input);
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateDealSchema.parse(req.body);
    const data = await pipelineService.update(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async updateStage(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateDealStageSchema.parse(req.body);
    const data = await pipelineService.updateStage(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async delete(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await pipelineService.delete(req.authContext, req.params.id);
    res.status(204).send();
  },
};
