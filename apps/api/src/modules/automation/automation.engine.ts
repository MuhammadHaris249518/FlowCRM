import { prisma } from "../../lib/prisma";
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowRun } from "@prisma/client";

type NodeWithEdges = WorkflowNode;
type WorkflowWithGraph = Workflow & { nodes: NodeWithEdges[]; edges: WorkflowEdge[] };

function findNextNodeId(edges: WorkflowEdge[], currentNodeId: string, branch?: "true" | "false"): string | null {
  const candidates = edges.filter((e) => e.sourceNodeId === currentNodeId);
  if (branch) {
    const match = candidates.find((e) => e.label === branch);
    return match?.targetNodeId ?? null;
  }
  return candidates[0]?.targetNodeId ?? null;
}

async function logStep(runId: string, nodeId: string, status: "SUCCESS" | "FAILED" | "SKIPPED", output?: unknown, error?: string) {
  await prisma.workflowRunLog.create({
    data: { runId, nodeId, status, output: output as object | undefined, error },
  });
}

function evaluateCondition(config: Record<string, unknown>, context: Record<string, unknown>): boolean {
  // v1 supports a single flat comparison: { field, op, value }.
  // field is a dotted path into context, e.g. "entity.score".
  const { field, op, value } = config as { field: string; op: string; value: unknown };
  const actual = field.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, context);

  switch (op) {
    case "eq": return actual === value;
    case "neq": return actual !== value;
    case "gte": return typeof actual === "number" && typeof value === "number" && actual >= value;
    case "lte": return typeof actual === "number" && typeof value === "number" && actual <= value;
    default: return false;
  }
}

async function executeStaticAction(config: Record<string, unknown>, context: Record<string, unknown>): Promise<unknown> {
  const action = config.action as string;
  const entityId = context.entityId as string;

  if (action === "CREATE_TASK") {
    return prisma.task.create({
      data: {
        organizationId: context.organizationId as string,
        title: (config.title as string) ?? "Follow up",
        assigneeId: (context.assigneeId as string) ?? null,
        priority: (config.priority as "LOW" | "MEDIUM" | "HIGH") ?? "MEDIUM",
        leadId: context.entityType === "Lead" ? entityId : undefined,
      },
    });
  }

  if (action === "UPDATE_LEAD_STATUS") {
    return prisma.lead.update({
      where: { id: entityId },
      data: { status: config.status as "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED" },
    });
  }

  throw new Error(`Unknown ACTION_STATIC action: ${action}`);
}

/**
 * Runs synchronous nodes (TRIGGER, CONDITION, ACTION_STATIC) forward until it
 * hits a DELAY node (persists WAITING + resumeAt), an ACTION_AI node
 * (deferred — sprint 2), or the graph ends (COMPLETED). Never holds a run
 * open across a delay — always returns after one node or one straight-line
 * synchronous run.
 */
export async function advanceRun(run: WorkflowRun, workflow: WorkflowWithGraph): Promise<void> {
  let currentNodeId = run.currentNodeId;
  let context = run.context as Record<string, unknown>;

  while (currentNodeId) {
    const node = workflow.nodes.find((n) => n.id === currentNodeId);
    if (!node) {
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "FAILED" },
      });
      await logStep(run.id, currentNodeId, "FAILED", undefined, "Node not found in graph");
      return;
    }

    const config = node.config as Record<string, unknown>;

    if (node.type === "TRIGGER") {
      await logStep(run.id, node.id, "SUCCESS");
      currentNodeId = findNextNodeId(workflow.edges, node.id);
      continue;
    }

    if (node.type === "CONDITION") {
      const result = evaluateCondition(config, context);
      await logStep(run.id, node.id, "SUCCESS", { result });
      currentNodeId = findNextNodeId(workflow.edges, node.id, result ? "true" : "false");
      continue;
    }

    if (node.type === "DELAY") {
      const hours = (config.hours as number) ?? 24;
      const resumeAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "WAITING", currentNodeId: node.id, resumeAt, context: context as object },
      });
      await logStep(run.id, node.id, "SUCCESS", { resumeAt });
      // Resume continues from the node AFTER this delay, not this node again.
      const next = findNextNodeId(workflow.edges, node.id);
      await prisma.workflowRun.update({ where: { id: run.id }, data: { currentNodeId: next } });
      return;
    }

    if (node.type === "ACTION_STATIC") {
      try {
        const output = await executeStaticAction(config, context);
        await logStep(run.id, node.id, "SUCCESS", output);
      } catch (err) {
        await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
        await logStep(run.id, node.id, "FAILED", undefined, (err as Error).message);
        return;
      }
      currentNodeId = findNextNodeId(workflow.edges, node.id);
      continue;
    }

    if (node.type === "ACTION_AI") {
      // Deferred to sprint 2 — do not implement here.
      await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
      await logStep(run.id, node.id, "FAILED", undefined, "ACTION_AI not yet implemented (sprint 2)");
      return;
    }
  }

  await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "COMPLETED" } });
}

export async function startRun(workflow: WorkflowWithGraph, entityType: string, entityId: string, seedContext: Record<string, unknown>): Promise<void> {
  const triggerNode = workflow.nodes.find((n) => n.type === "TRIGGER");
  if (!triggerNode) return;

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      organizationId: workflow.organizationId,
      entityType,
      entityId,
      currentNodeId: triggerNode.id,
      context: seedContext as object,
    },
  });

  await advanceRun(run, workflow);
}
