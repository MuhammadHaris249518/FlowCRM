import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { crmService } from "./crm.service";
import {
  companyQuerySchema,
  contactQuerySchema,
  createCompanySchema,
  createContactSchema,
  updateCompanySchema,
  updateContactSchema,
} from "./crm.validation";

export const crmController = {
  async listCompanies(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = companyQuerySchema.parse(req.query);
    const data = await crmService.listCompanies(req.authContext, query);
    res.json({ success: true, data });
  },

  async getCompany(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await crmService.getCompany(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async createCompany(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = createCompanySchema.parse(req.body);
    const data = await crmService.createCompany(req.authContext, input);
    res.status(201).json({ success: true, data });
  },

  async updateCompany(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateCompanySchema.parse(req.body);
    const data = await crmService.updateCompany(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async deleteCompany(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await crmService.deleteCompany(req.authContext, req.params.id);
    res.status(204).send();
  },

  async listContacts(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = contactQuerySchema.parse(req.query);
    const data = await crmService.listContacts(req.authContext, query);
    res.json({ success: true, data });
  },

  async getContact(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const data = await crmService.getContact(req.authContext, req.params.id);
    res.json({ success: true, data });
  },

  async createContact(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = createContactSchema.parse(req.body);
    const data = await crmService.createContact(req.authContext, input);
    res.status(201).json({ success: true, data });
  },

  async updateContact(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const input = updateContactSchema.parse(req.body);
    const data = await crmService.updateContact(req.authContext, req.params.id, input);
    res.json({ success: true, data });
  },

  async deleteContact(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    await crmService.deleteContact(req.authContext, req.params.id);
    res.status(204).send();
  },
};
