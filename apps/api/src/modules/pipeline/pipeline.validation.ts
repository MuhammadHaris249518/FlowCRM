import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const dealStageEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const dealQuerySchema = paginationQuerySchema.extend({
  stage: dealStageEnum.optional(),
  assigneeId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
});

export const createDealSchema = z.object({
  title: z.string().trim().min(1).max(200),
  value: z.coerce.number().min(0).max(999999999999.99),
  stage: dealStageEnum.optional(),
  companyId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
});

// Stage is intentionally excluded here — stage moves go through the
// dedicated PATCH /:id/stage endpoint so closedAt + Activity logging
// can't be bypassed by editing stage through the generic update route.
export const updateDealSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  value: z.coerce.number().min(0).max(999999999999.99).optional(),
  companyId: z.string().cuid().nullable().optional(),
  contactId: z.string().cuid().nullable().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
});

export const updateDealStageSchema = z.object({
  stage: dealStageEnum,
});

export type DealQuery = z.infer<typeof dealQuerySchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateDealStageInput = z.infer<typeof updateDealStageSchema>;
