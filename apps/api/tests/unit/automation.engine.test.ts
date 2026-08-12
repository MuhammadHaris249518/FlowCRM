import { prisma } from "../../src/lib/prisma";
import { advanceRun, startRun } from "../../src/modules/automation/automation.engine";
import { aiServiceClient } from "../../src/lib/ai-service-client";
import { setupOrgWithUsers, cleanupTestContext, type TestOrgContext } from "../helpers/fixtures";

jest.mock("../../src/lib/ai-service-client", () => {
  const originalModule = jest.requireActual("../../src/lib/ai-service-client");
  return {
    ...originalModule,
    aiServiceClient: {
      ...originalModule.aiServiceClient,
      createEmailDraft: jest.fn(),
      getEmailDraftStatus: jest.fn(),
    },
  };
});

describe("Automation Engine - ACTION_AI", () => {
  let orgCtx: TestOrgContext;

  beforeAll(async () => {
    orgCtx = await setupOrgWithUsers(["SALES_MANAGER"]);
  });

  afterAll(async () => {
    if (orgCtx) await cleanupTestContext(orgCtx);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches ACTION_AI node to ai-service and transitions run to WAITING with aiJobId set", async () => {
    (aiServiceClient.createEmailDraft as jest.Mock).mockResolvedValueOnce({
      jobId: "job-test-123",
      status: "pending",
    });

    const workflow = await prisma.workflow.create({
      data: {
        name: "AI Email Workflow",
        organizationId: orgCtx.organizationId,
        isActive: true,
        nodes: {
          create: [
            {
              id: "node-trigger",
              type: "TRIGGER",
              config: { trigger: "LEAD_CREATED" },
            },
            {
              id: "node-ai",
              type: "ACTION_AI",
              config: { instructions: "Draft a welcoming email" },
            },
          ],
        },
        edges: {
          create: [
            {
              sourceNodeId: "node-trigger",
              targetNodeId: "node-ai",
            },
          ],
        },
      },
      include: { nodes: true, edges: true },
    });

    const lead = await prisma.lead.create({
      data: {
        organizationId: orgCtx.organizationId,
        status: "NEW",
        notes: "Interested in enterprise plan",
      },
    });

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        organizationId: orgCtx.organizationId,
        entityType: "Lead",
        entityId: lead.id,
        currentNodeId: "node-ai",
        context: { organizationId: orgCtx.organizationId, entityType: "Lead", entityId: lead.id },
      },
    });

    await advanceRun(run, workflow);

    const updatedRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(updatedRun.status).toBe("WAITING");
    expect(updatedRun.aiJobId).toBe("job-test-123");
    expect(updatedRun.aiPollAttempts).toBe(0);
    expect(updatedRun.currentNodeId).toBe("node-ai");
    expect(aiServiceClient.createEmailDraft).toHaveBeenCalledWith({
      instructions: "Draft a welcoming email",
      context: expect.objectContaining({
        notes: "Interested in enterprise plan",
      }),
    });
  });

  it("fails run immediately if ACTION_AI node has missing instructions configured", async () => {
    const workflow = await prisma.workflow.create({
      data: {
        name: "Invalid AI Workflow",
        organizationId: orgCtx.organizationId,
        isActive: true,
        nodes: {
          create: [
            {
              id: "node-trigger-2",
              type: "TRIGGER",
              config: { trigger: "LEAD_CREATED" },
            },
            {
              id: "node-ai-empty",
              type: "ACTION_AI",
              config: { instructions: "   " },
            },
          ],
        },
        edges: {
          create: [
            {
              sourceNodeId: "node-trigger-2",
              targetNodeId: "node-ai-empty",
            },
          ],
        },
      },
      include: { nodes: true, edges: true },
    });

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        organizationId: orgCtx.organizationId,
        entityType: "Lead",
        entityId: "lead-1",
        currentNodeId: "node-ai-empty",
        context: { organizationId: orgCtx.organizationId, entityType: "Lead", entityId: "lead-1" },
      },
    });

    await advanceRun(run, workflow);

    const updatedRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(updatedRun.status).toBe("FAILED");
    expect(aiServiceClient.createEmailDraft).not.toHaveBeenCalled();

    const logs = await prisma.workflowRunLog.findMany({ where: { runId: run.id } });
    expect(logs.some((l) => l.error?.includes("has no instructions configured"))).toBe(true);
  });
});
