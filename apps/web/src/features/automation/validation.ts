import { z } from "zod";
import { NODE_CONFIG_SCHEMAS } from "./lib/node-defs";
import type { WorkflowNodeType } from "./types";

export const workflowNameSchema = z
  .string()
  .trim()
  .min(1, "Workflow name is required")
  .max(200, "Keep the name under 200 characters");

export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["TRIGGER", "CONDITION", "DELAY", "ACTION_STATIC", "ACTION_AI"]),
  config: z.record(z.unknown()),
  positionX: z.number(),
  positionY: z.number(),
});

export const workflowEdgeSchema = z.object({
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  label: z.string().max(50).optional(),
});

/**
 * Validates a whole graph before it is sent to the API. Runs three passes:
 *  1. Structural (Zod) — every node/edge has the right shape.
 *  2. Per-node config — each node's `config` matches its type's schema
 *     (this is what NODE_CONFIG_SCHEMAS in node-defs.ts is for; the backend
 *     does not check this, so skipping it here would let broken graphs save
 *     successfully and only fail silently at run time).
 *  3. Graph shape — exactly one entry TRIGGER, no dangling edge endpoints,
 *     no self-loops, no orphan non-trigger nodes.
 *
 * Returns a flat list of human-readable error strings (empty = valid).
 * Deliberately returns strings rather than throwing — the toolbar renders
 * these directly next to the Save button.
 */
export function validateWorkflowGraph(input: {
  name: string;
  nodes: { id: string; type: WorkflowNodeType; config: Record<string, unknown> }[];
  edges: { sourceNodeId: string; targetNodeId: string }[];
}): string[] {
  const errors: string[] = [];

  const nameResult = workflowNameSchema.safeParse(input.name);
  if (!nameResult.success) {
    errors.push(nameResult.error.issues[0]?.message ?? "Invalid workflow name");
  }

  if (input.nodes.length === 0) {
    errors.push("Add at least one node to save this workflow.");
    return errors; // nothing further to check against an empty graph
  }

  const triggerNodes = input.nodes.filter((n) => n.type === "TRIGGER");
  if (triggerNodes.length === 0) {
    errors.push("Every workflow needs exactly one Trigger node to start it.");
  } else if (triggerNodes.length > 1) {
    errors.push("A workflow can only have one Trigger node.");
  }

  const nodeIds = new Set(input.nodes.map((n) => n.id));

  for (const node of input.nodes) {
    const schema = NODE_CONFIG_SCHEMAS[node.type];
    const result = schema.safeParse(node.config);
    if (!result.success) {
      errors.push(`"${node.type}" node is misconfigured: ${result.error.issues[0]?.message}`);
    }
  }

  for (const edge of input.edges) {
    if (edge.sourceNodeId === edge.targetNodeId) {
      errors.push("A node cannot connect to itself.");
    }
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      errors.push("Found a connection pointing to a node that no longer exists.");
    }
  }

  // Every non-trigger node should be reachable — otherwise it's dead weight
  // the engine will never execute. Warn, don't block save (a person may be
  // mid-edit), but surface it clearly.
  const reachable = new Set(triggerNodes.map((n) => n.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of input.edges) {
      if (reachable.has(edge.sourceNodeId) && !reachable.has(edge.targetNodeId)) {
        reachable.add(edge.targetNodeId);
        changed = true;
      }
    }
  }
  const unreachable = input.nodes.filter((n) => n.type !== "TRIGGER" && !reachable.has(n.id));
  if (unreachable.length > 0) {
    errors.push(
      `${unreachable.length} node${unreachable.length > 1 ? "s are" : " is"} not connected to the Trigger and will never run.`
    );
  }

  return errors;
}
