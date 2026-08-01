import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const companyQuerySchema = paginationQuerySchema;

export const contactQuerySchema = paginationQuerySchema.extend({
  companyId: z.string().cuid().optional(),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  domain: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(100).optional(),
  website: z.string().trim().url("Must be a valid URL").max(300).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const createContactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("Must be a valid email").optional(),
  phone: z.string().trim().max(30).optional(),
  title: z.string().trim().max(150).optional(),
  companyId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CompanyQuery = z.infer<typeof companyQuerySchema>;
export type ContactQuery = z.infer<typeof contactQuerySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
