import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { assistantChatBodySchema } from "./assistant.validation";
import { assistantService } from "./assistant.service";

export const assistantController = {
  async chat(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const body = assistantChatBodySchema.parse(req.body);
    const data = await assistantService.chat(req.authContext, body.messages);
    res.json({ success: true, data });
  },
};
