import { prisma } from "../../src/lib/prisma";
import { pollAiJobsOnce } from "../../src/modules/automation/automation.ai-poller";
import { resolveAiNode, AI_MAX_POLL_ATTEMPTS } from "../../src/modules/automation/automation.engine";
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

describe("Automation AI Poller & resolveAiNode", () => {
  let orgCtx: TestOrgContext;
  let workflow: any;

  beforeAll(async () => {
    orgCtx = await setupOrgWithUsers(["SALES_MANAGER"]);

    workflow = await prisma.workflow.create({
      data: {
        name: "AI Draft & Task Workflow",
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
              config: { instructions: "Draft email" },
            },
            {
              id: "node-task",
              type: "ACTION_STATIC",
              config: { action: "CREATE_TASK", title: "Follow-up after draft" },
            },
          ],
        },
        edges: {
          create: [
            {
              sourceNodeId: "node-trigger",
              targetNodeId: "node-ai",
            },
            {
              sourceNodeId: "node-ai",
              targetNodeId: "node-task",
            },
          ],
        },
      },
      include: { nodes: true, edges: true },
    });
  });

  afterAll(async () => {
    if (orgCtx) await cleanupTestContext(orgCtx);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles completed job: creates draft Task, clears AI fields, and continues to next node", async () => {
    (aiServiceClient.getEmailDraftStatus as jest.Mock).mockResolvedValueOnce({
      jobId: "job-completed-1",
      status: "completed",
      result: {
        subject: "Introduction Email",
        body: "Hello, nice to connect with you!",
        revisionCount: 2,
        finalFeedback: "Looks great",
      },
      error: null,
    });

    const lead = await prisma.lead.create({
      data: {
        organizationId: orgCtx.organizationId,
        status: "NEW",
      },
    });

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        organizationId: orgCtx.organizationId,
        entityType: "Lead",
        entityId: lead.id,
        status: "WAITING",
        currentNodeId: "node-ai",
        aiJobId: "job-completed-1",
        aiPollAttempts: 0,
        resumeAt: new Date(Date.now() - 1000), // due
        context: { organizationId: orgCtx.organizationId, entityType: "Lead", entityId: lead.id },
      },
    });

    await pollAiJobsOnce();

    const updatedRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(updatedRun.status).toBe("COMPLETED");
    expect(updatedRun.aiJobId).toBeNull();

    // Verify task created by resolveAiNode
    const reviewTask = await prisma.task.findFirst({
      where: {
        organizationId: orgCtx.organizationId,
        title: "Review AI-drafted email: Introduction Email",
      },
    });
    expect(reviewTask).not.toBeNull();
    expect(reviewTask?.description).toContain("Hello, nice to connect with you!");
    expect(reviewTask?.leadId).toBe(lead.id);

    // Verify next node (CREATE_TASK) was executed by advanceRun
    const nextTask = await prisma.task.findFirst({
      where: {
        organizationId: orgCtx.organizationId,
        title: "Follow-up after draft",
      },
    });
    expect(nextTask).not.toBeNull();
  });

  it("handles failed job: marks run FAILED and logs error", async () => {
    (aiServiceClient.getEmailDraftStatus as jest.Mock).mockResolvedValueOnce({
      jobId: "job-failed-1",
      status: "failed",
      result: null,
      error: "LLM rate limit exceeded",
    });

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        organizationId: orgCtx.organizationId,
        entityType: "Lead",
        entityId: "lead-2",
        status: "WAITING",
        currentNodeId: "node-ai",
        aiJobId: "job-failed-1",
        aiPollAttempts: 1,
        resumeAt: new Date(Date.now() - 1000),
        context: { organizationId: orgCtx.organizationId, entityType: "Lead", entityId: "lead-2" },
      },
    });

    await pollAiJobsOnce();

    const updatedRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(updatedRun.status).toBe("FAILED");
    expect(updatedRun.aiJobId).toBeNull();

    const logs = await prisma.workflowRunLog.findMany({ where: { runId: run.id } });
    expect(logs.some((l) => l.error === "LLM rate limit exceeded")).toBe(true);
  });

  it("handles pending job past AI_MAX_POLL_ATTEMPTS: marks run FAILED with timeout message", async () => {
    (aiServiceClient.getEmailDraftStatus as jest.Mock).mockResolvedValueOnce({
      jobId: "job-pending-timeout",
      status: "pending",
      result: null,
      error: null,
    });

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        organizationId: orgCtx.organizationId,
        entityType: "Lead",
        entityId: "lead-3",
        status: "WAITING",
        currentNodeId: "node-ai",
        aiJobId: "job-pending-timeout",
        aiPollAttempts: AI_MAX_POLL_ATTEMPTS - 1, // 39, next attempt is 40
        resumeAt: new Date(Date.now() - 1000),
        context: { organizationId: orgCtx.organizationId, entityType: "Lead", entityId: "lead-3" },
      },
    });

    await resolveAiNode(run, workflow);

    const updatedRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(updatedRun.status).toBe("FAILED");
    expect(updatedRun.aiJobId).toBeNull();

    const logs = await prisma.workflowRunLog.findMany({ where: { runId: run.id } });
    expect(logs.some((l) => l.error?.includes("Timed out waiting on ai-service email draft job"))).toBe(true);
  });
});
