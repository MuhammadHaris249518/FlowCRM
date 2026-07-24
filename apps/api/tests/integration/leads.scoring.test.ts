import request from "supertest";
import { __setMockClerkUserId } from "../../__mocks__/@clerk/express";
import { prisma } from "../../src/lib/prisma";
import { buildTestApp } from "../helpers/test-app";
import {
  setupOrgWithUsers,
  cleanupTestContext,
  authHeaders,
  createTestContact,
  type TestOrgContext,
} from "../helpers/fixtures";

// Never call the real ai-service (or Groq) from a test — mock the boundary,
// same reasoning as the manual Clerk mock: tests must be deterministic and
// must not depend on a second running process or a live API key.
jest.mock("../../src/lib/ai-service-client", () => ({
  aiServiceClient: {
    scoreLead: jest.fn().mockResolvedValue({
      score: 72,
      reasoning: "Referral source with complete contact details.",
    }),
  },
}));

describe("Lead AI scoring", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let rep: TestOrgContext["users"][number];
  let lead: { id: string };

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_REP"]);
    [rep] = ctx.users;

    const contact = await createTestContact(ctx.organizationId, {
      fullName: "Score Target",
      ownerId: rep.id,
    });

    lead = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contact.id,
        source: "Referral",
        notes: "Mentioned a $50k budget and needs to launch next quarter.",
        assigneeId: rep.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("scores a lead, persists the result, and logs AI_LEAD_SCORED", async () => {
    __setMockClerkUserId(rep.clerkId);

    const res = await request(app)
      .post(`/api/v1/leads/${lead.id}/score`)
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(72);

    const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updated?.score).toBe(72);

    const activity = await prisma.activity.findFirst({
      where: { organizationId: ctx.organizationId, type: "AI_LEAD_SCORED" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity).not.toBeNull();
  });
});
