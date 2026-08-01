import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { crmController } from "./crm.controller";

export const crmRouter = Router();

crmRouter.use(requireAuth());

crmRouter.get("/companies", asyncHandler(crmController.listCompanies));
crmRouter.post("/companies", asyncHandler(crmController.createCompany));
crmRouter.get("/companies/:id", asyncHandler(crmController.getCompany));
crmRouter.patch("/companies/:id", asyncHandler(crmController.updateCompany));
crmRouter.delete("/companies/:id", asyncHandler(crmController.deleteCompany));

crmRouter.get("/contacts", asyncHandler(crmController.listContacts));
crmRouter.post("/contacts", asyncHandler(crmController.createContact));
crmRouter.get("/contacts/:id", asyncHandler(crmController.getContact));
crmRouter.patch("/contacts/:id", asyncHandler(crmController.updateContact));
crmRouter.delete("/contacts/:id", asyncHandler(crmController.deleteContact));
