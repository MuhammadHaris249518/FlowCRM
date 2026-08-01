import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { tasksService } from "./tasks.service";
import {
  createTaskSchema,
  taskCalendarQuerySchema,
  taskQuerySchema,
  updateTaskSchema,
} from "./tasks.validation";

export const tasksController = {
  async list(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = taskQuerySchema.parse(req.query);
    const data = await tasksService.list(req.authContext, query);
    res.json({ success: true, data });
  },

  async calendar(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = taskCalendarQuerySchema.parse(req.query);
    const data = await tasksService.calendar(req.authContext, query);
    res.json({ success: true, data });
  },

  async getById(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await tasksService.getById(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = createTaskSchema.parse(req.body);
    const data = await tasksService.create(req.authContext, input);
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateTaskSchema.parse(req.body);
    const data = await tasksService.update(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async delete(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await tasksService.delete(req.authContext, req.params.id);
    res.status(204).send();
  },

  async complete(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await tasksService.complete(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async reopen(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await tasksService.reopen(req.authContext, req.params.id);
    res.json({ success: true, data });
  },
};
