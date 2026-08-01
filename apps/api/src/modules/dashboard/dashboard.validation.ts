import { z } from "zod";

// this_week / this_month / this_quarter cover the ranges shown in the
// dashboard's period selector. Defaulting to this_month matches the mock.
export const dashboardSummaryQuerySchema = z.object({
  range: z.enum(["this_week", "this_month", "this_quarter"]).default("this_month"),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;

export const recentActivitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
