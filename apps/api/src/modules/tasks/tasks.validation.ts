import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const taskQuerySchema = paginationQuerySchema.extend({
  assigneeId: z.string().cuid().optional(),
  priority: taskPriorityEnum.optional(),
  contactId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  // "true" -> completed only, "false" -> pending only, omitted -> both
  completed: z.enum(["true", "false"]).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
});

// Range is required — the calendar view always queries a bounded window
// (the visible month), never "all tasks ever" without a due date filter.
export const taskCalendarQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  assigneeId: z.string().cuid().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: taskPriorityEnum.optional(),
  dueAt: z.coerce.date().optional(),
  assigneeId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
});

// completedAt is intentionally excluded — completion goes through the
// dedicated /:id/complete and /:id/reopen endpoints so the Activity log
// can't be bypassed by editing it through the generic update route.
export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: taskPriorityEnum.optional(),
  dueAt: z.coerce.date().nullable().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  contactId: z.string().cuid().nullable().optional(),
  dealId: z.string().cuid().nullable().optional(),
  leadId: z.string().cuid().nullable().optional(),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type TaskCalendarQuery = z.infer<typeof taskCalendarQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
