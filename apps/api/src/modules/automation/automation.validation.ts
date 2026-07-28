import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const nodeSchema = z.object({
  id: z.string().min(1), // client-generated temp id, used to wire edges below
  type: z.enum(["TRIGGER", "CONDITION", "DELAY", "ACTION_STATIC", "ACTION_AI"]),
  config: z.record(z.unknown()),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
});

const edgeSchema = z.object({
  sourceNodeId: z.string().min(1), // references a node's temp id above
  targetNodeId: z.string().min(1),
  label: z.string().max(50).optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  isActive: z.boolean().default(false),
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema),
});

export const updateWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
