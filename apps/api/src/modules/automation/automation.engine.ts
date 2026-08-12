import { prisma } from "../../lib/prisma";
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowRun } from "@prisma/client";
import { aiServiceClient, type EmailDraftContext } from "../../lib/ai-service-client";

export const AI_POLL_INTERVAL_MS = 5000;
export const AI_MAX_POLL_ATTEMPTS = 40; // ~3.3 min ceiling — job_store is in-memory and non-durable

type NodeWithEdges = WorkflowNode;
type WorkflowWithGraph = Workflow & { nodes: NodeWithEdges[]; edges: WorkflowEdge[] };

// Builds the personalization context ai-service needs to draft a real email.
// Unlike lead scoring, this intentionally sends real names/notes, not boolean
// signals — the org boundary is enforced by scoping this query to context.organizationId.
async function buildEmailDraftContext(context: Record<string, unknown>): Promise<EmailDraftContext> {
  const organizationId = context.organizationId as string;
  const entityType = context.entityType as string;
  const entityId = context.entityId as string;

  if (entityType === "Lead") {
    const lead = await prisma.lead.findFirst({
      where: { id: entityId, organizationId },
      include: { contact: { include: { company: true } } },
    });
    return {
      contactName: lead?.contact?.fullName ?? null,
      companyName: lead?.contact?.company?.name ?? null,
      leadStatus: lead?.status ?? null,
      leadSource: lead?.source ?? null,
      notes: lead?.notes ?? null,
    };
  }

  if (entityType === "Deal") {
    const deal = await prisma.deal.findFirst({
      where: { id: entityId, organizationId },
      include: { contact: true, company: true },
    });
    return {
      contactName: deal?.contact?.fullName ?? null,
      companyName: deal?.company?.name ?? null,
      dealStage: deal?.stage ?? null,
      dealTitle: deal?.title ?? null,
    };
  }

  return {};
}

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
      const instructions = (config.instructions as string | undefined)?.trim();
      if (!instructions) {
        await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
        await logStep(run.id, node.id, "FAILED", undefined, "ACTION_AI node has no instructions configured");
        return;
      }

      try {
        const draftContext = await buildEmailDraftContext(context);
        const job = await aiServiceClient.createEmailDraft({ instructions, context: draftContext });

        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "WAITING",
            currentNodeId: node.id, // stay on this node — resolved by the AI poller, not the resume poller
            aiJobId: job.jobId,
            aiPollAttempts: 0,
            resumeAt: new Date(Date.now() + AI_POLL_INTERVAL_MS),
            context: context as object,
          },
        });
        await logStep(run.id, node.id, "SUCCESS", { jobId: job.jobId, status: "dispatched" });
      } catch (err) {
        await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
        await logStep(run.id, node.id, "FAILED", undefined, `Failed to dispatch to ai-service: ${(err as Error).message}`);
      }
      return;
    }
  }

  await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "COMPLETED" } });
}

export async function resolveAiNode(run: WorkflowRun, workflow: WorkflowWithGraph): Promise<void> {
  if (!run.aiJobId) return;

  let status;
  try {
    status = await aiServiceClient.getEmailDraftStatus(run.aiJobId);
  } catch (err) {
    // Transient network error talking to ai-service — don't fail the run yet,
    // just let the next poll cycle retry (still bounded by aiPollAttempts below).
    await bumpAiPollAttempt(run, `Poll error: ${(err as Error).message}`);
    return;
  }

  if (status.status === "completed" && status.result) {
    const context = run.context as Record<string, unknown>;
    await prisma.task.create({
      data: {
        organizationId: context.organizationId as string,
        title: `Review AI-drafted email: ${status.result.subject}`,
        description: `To: ${context.entityType} ${context.entityId}\n\nSubject: ${status.result.subject}\n\n${status.result.body}\n\n---\nDrafted by AI (${status.result.revisionCount} revision(s)). Review and send manually — not auto-sent.`,
        leadId: context.entityType === "Lead" ? (context.entityId as string) : undefined,
        dealId: context.entityType === "Deal" ? (context.entityId as string) : undefined,
        priority: "MEDIUM",
      },
    });

    const node = workflow.nodes.find((n) => n.id === run.currentNodeId)!;
    const next = findNextNodeId(workflow.edges, node.id);

    await logStep(run.id, node.id, "SUCCESS", { jobId: run.aiJobId, result: status.result });
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "RUNNING", currentNodeId: next, aiJobId: null, aiPollAttempts: 0, resumeAt: null },
    });

    const updated = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    await advanceRun(updated, workflow);
    return;
  }

  if (status.status === "failed") {
    await logStep(run.id, run.currentNodeId!, "FAILED", undefined, status.error ?? "ai-service job failed");
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "FAILED", aiJobId: null, resumeAt: null },
    });
    return;
  }

  // still pending/running
  await bumpAiPollAttempt(run);
}

async function bumpAiPollAttempt(run: WorkflowRun, timeoutError?: string): Promise<void> {
  const attempts = run.aiPollAttempts + 1;
  if (attempts >= AI_MAX_POLL_ATTEMPTS) {
    await logStep(run.id, run.currentNodeId!, "FAILED", undefined, timeoutError ?? "Timed out waiting on ai-service email draft job");
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "FAILED", aiJobId: null, resumeAt: null },
    });
    return;
  }
  await prisma.workflowRun.update({
    where: { id: run.id },
    data: { aiPollAttempts: attempts, resumeAt: new Date(Date.now() + AI_POLL_INTERVAL_MS) },
  });
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
