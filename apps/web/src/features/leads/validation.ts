import { z } from "zod";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DISQUALIFIED",
  "CONVERTED",
] as const;

export const createLeadFormSchema = z.object({
  contactFullName: z.string().trim().min(1, "Contact name is required").max(200),
  contactEmail: z.string().trim().email("Must be a valid email").optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateLeadFormValues = z.infer<typeof createLeadFormSchema>;

export const editLeadFormSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  score: z.coerce.number().int().min(0).max(100),
});

export type EditLeadFormValues = z.infer<typeof editLeadFormSchema>;
