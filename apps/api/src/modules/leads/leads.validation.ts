import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const leadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DISQUALIFIED",
  "CONVERTED",
]);

export const leadQuerySchema = paginationQuerySchema.extend({
  status: leadStatusEnum.optional(),
  assigneeId: z.string().cuid().optional(),
});

// A lead must reference a contact. Either point at an existing one, or
// provide enough inline detail to create one alongside the lead (most
// leads arrive without a pre-existing contact record).
export const createLeadSchema = z
  .object({
    contactId: z.string().cuid().optional(),
    contactFullName: z.string().trim().min(1).max(200).optional(),
    contactEmail: z.string().trim().email("Must be a valid email").optional(),
    contactPhone: z.string().trim().max(30).optional(),
    source: z.string().trim().max(100).optional(),
    status: leadStatusEnum.optional(),
    score: z.coerce.number().int().min(0).max(100).optional(),
    assigneeId: z.string().cuid().optional(),
  })
  .refine((data) => Boolean(data.contactId) || Boolean(data.contactFullName), {
    message: "Provide either contactId or contactFullName to identify who this lead is",
    path: ["contactId"],
  });

// Editing a lead only ever touches the lead's own fields — contact info
// edits go through the CRM contact endpoints, not this one.
export const updateLeadSchema = z.object({
  status: leadStatusEnum.optional(),
  source: z.string().trim().max(100).optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
  assigneeId: z.string().cuid().optional(),
});

export type LeadQuery = z.infer<typeof leadQuerySchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
