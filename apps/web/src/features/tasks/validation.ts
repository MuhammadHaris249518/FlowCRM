import { z } from "zod";

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const createTaskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priority: z.enum(TASK_PRIORITIES),
  dueAt: z.string().optional().or(z.literal("")), // datetime-local input value
});

export type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>;

export const editTaskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priority: z.enum(TASK_PRIORITIES),
  dueAt: z.string().optional().or(z.literal("")),
});

export type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;
