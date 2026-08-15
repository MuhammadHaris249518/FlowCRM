import { z } from "zod";

// Deliberately duplicated from dashboard.validation.ts rather than imported —
// keeps reports and dashboard as independent modules per the feature-based
// structure; this enum is 3 lines and not worth a cross-module dependency.
export const reportsRangeQuerySchema = z.object({
  range: z.enum(["this_week", "this_month", "this_quarter"]).default("this_month"),
});

export type ReportsRangeQuery = z.infer<typeof reportsRangeQuerySchema>;

export const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
