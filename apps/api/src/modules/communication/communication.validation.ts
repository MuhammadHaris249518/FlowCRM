import { z } from "zod";

export const listThreadQuerySchema = z.object({
  contactId: z.string().optional(),
  leadId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
