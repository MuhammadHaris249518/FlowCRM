import { prisma } from "../../src/lib/prisma";
import { pollOutboxOnce } from "../../src/modules/automation/automation.outbox-poller";
import {
  setupOrgWithUsers,
  cleanupTestContext,
  type TestOrgContext,
} from "../helpers/fixtures";

describe("LEAD_SCORE_CHANGED trigger", () => {
  let orgCtx: TestOrgContext;

  beforeAll(async () => {
    orgCtx = await setupOrgWithUsers(["SALES_MANAGER"]);
  });

  afterAll(async () => {
    if (orgCtx) await cleanupTestContext(orgCtx);
  });

  it("starts a workflow run when a LEAD_SCORE_CHANGED event is polled", async () => {
    await prisma.workflow.create({
      data: {
        name: "High score follow-up",
        organizationId: orgCtx.organizationId,
        isActive: true,
        nodes: {
          create: [
            { id: "node-trigger-score", type: "TRIGGER", config: { trigger: "LEAD_SCORE_CHANGED" } },
          ],
        },
        edges: { create: [] },
      },
    });

    const lead = await prisma.lead.create({
      data: { organizationId: orgCtx.organizationId, status: "NEW" },
    });

    await prisma.outboxEvent.create({
      data: {
        organizationId: orgCtx.organizationId,
        type: "LEAD_SCORE_CHANGED",
        payload: {
          entityType: "Lead",
          entityId: lead.id,
          entity: { score: 85, previousScore: 40, reasoning: "test" },
        },
      },
    });

    await pollOutboxOnce();

    const run = await prisma.workflowRun.findFirst({
      where: { organizationId: orgCtx.organizationId, entityId: lead.id },
    });
    expect(run).not.toBeNull();
    // context should carry the nested entity shape CONDITION nodes expect
    expect((run?.context as any).entity.score).toBe(85);

    const processedEvent = await prisma.outboxEvent.findFirst({
      where: { organizationId: orgCtx.organizationId, type: "LEAD_SCORE_CHANGED" },
    });
    expect(processedEvent?.processedAt).not.toBeNull();
  });

  it("does not emit an event when the score is re-saved unchanged", async () => {
    const lead = await prisma.lead.create({
      data: { organizationId: orgCtx.organizationId, status: "NEW", score: 0 },
    });

    // Simulate scoreWithAi resolving to the same score it already had.
    const { leadsRepository } = await import("../../src/modules/leads/leads.repository");
    await leadsRepository.updateScore(
      { organizationId: orgCtx.organizationId, userId: orgCtx.users[0].id, clerkId: orgCtx.users[0].clerkId, role: "SALES_MANAGER" },
      lead.id,
      0,
      "no change"
    );

    const event = await prisma.outboxEvent.findFirst({
      where: { organizationId: orgCtx.organizationId, type: "LEAD_SCORE_CHANGED", payload: { path: ["entityId"], equals: lead.id } },
    });
    expect(event).toBeNull();
  });
});
