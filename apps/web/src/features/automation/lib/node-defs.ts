import { z } from "zod";
import {
  Zap,
  GitBranch,
  Clock,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { WorkflowNodeType } from "../types";

// --- Per-type config schemas -----------------------------------------
// These are the only place a node's config shape is allowed to be defined.
// Both NodeConfigPanel (form fields) and validation.ts (save-time guard)
// derive from this file so the two can never drift apart.

export const triggerConfigSchema = z.object({
  trigger: z.enum([
    "LEAD_CREATED",
    "LEAD_STATUS_CHANGED",
    "DEAL_STAGE_CHANGED",
    "TASK_OVERDUE",
    "ACTIVITY_LOGGED",
  ]),
});

export const conditionConfigSchema = z.object({
  field: z.string().trim().min(1, "Field is required (e.g. entity.score)"),
  op: z.enum(["eq", "neq", "gte", "lte"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const delayConfigSchema = z.object({
  hours: z.coerce.number().min(0.25, "Minimum delay is 15 minutes").max(8760, "Maximum delay is 1 year"),
});

const createTaskConfigSchema = z.object({
  action: z.literal("CREATE_TASK"),
  title: z.string().trim().min(1, "Task title is required").max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

const updateLeadStatusConfigSchema = z.object({
  action: z.literal("UPDATE_LEAD_STATUS"),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "DISQUALIFIED", "CONVERTED"]),
});

export const actionStaticConfigSchema = z.discriminatedUnion("action", [
  createTaskConfigSchema,
  updateLeadStatusConfigSchema,
]);

export const actionAiConfigSchema = z.object({
  instructions: z.string().trim().max(2000).optional().default(""),
});

export const NODE_CONFIG_SCHEMAS: Record<WorkflowNodeType, z.ZodTypeAny> = {
  TRIGGER: triggerConfigSchema,
  CONDITION: conditionConfigSchema,
  DELAY: delayConfigSchema,
  ACTION_STATIC: actionStaticConfigSchema,
  ACTION_AI: actionAiConfigSchema,
};

export function getDefaultConfig(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case "TRIGGER":
      return { trigger: "LEAD_CREATED" };
    case "CONDITION":
      return { field: "entity.score", op: "gte", value: 50 };
    case "DELAY":
      return { hours: 24 };
    case "ACTION_STATIC":
      return { action: "CREATE_TASK", title: "Follow up", priority: "MEDIUM" };
    case "ACTION_AI":
      return { instructions: "" };
  }
}

// --- Palette / node-shell metadata ------------------------------------

export interface NodeTypeDef {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind text/bg color token, matches app palette
  implemented: boolean; // false => engine cannot execute this yet
  /** TRIGGER nodes start a graph and can't receive incoming edges. */
  isEntryPoint: boolean;
}

export const NODE_TYPE_DEFS: Record<WorkflowNodeType, NodeTypeDef> = {
  TRIGGER: {
    type: "TRIGGER",
    label: "Trigger",
    description: "Starts the workflow when something happens in FlowCRM.",
    icon: Zap,
    accent: "text-blue-600 bg-blue-50 border-blue-200",
    implemented: true,
    isEntryPoint: true,
  },
  CONDITION: {
    type: "CONDITION",
    label: "Condition",
    description: "Branches the workflow based on a field comparison.",
    icon: GitBranch,
    accent: "text-violet-600 bg-violet-50 border-violet-200",
    implemented: true,
    isEntryPoint: false,
  },
  DELAY: {
    type: "DELAY",
    label: "Delay",
    description: "Pauses the workflow for a fixed number of hours.",
    icon: Clock,
    accent: "text-amber-600 bg-amber-50 border-amber-200",
    implemented: true,
    isEntryPoint: false,
  },
  ACTION_STATIC: {
    type: "ACTION_STATIC",
    label: "Action",
    description: "Creates a task or updates a lead's status.",
    icon: ListChecks,
    accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    implemented: true,
    isEntryPoint: false,
  },
  ACTION_AI: {
    type: "ACTION_AI",
    label: "AI Action",
    description: "Coming soon — AI-driven actions are not runnable yet.",
    icon: Sparkles,
    accent: "text-ink-500 bg-surface-muted border-surface-border",
    implemented: false,
    isEntryPoint: false,
  },
};

export const PALETTE_ORDER: WorkflowNodeType[] = [
  "TRIGGER",
  "CONDITION",
  "DELAY",
  "ACTION_STATIC",
  "ACTION_AI",
];
