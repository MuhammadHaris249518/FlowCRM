import request from "supertest";
import { __setMockClerkUserId } from "../../__mocks__/@clerk/express";
import { prisma } from "../../src/lib/prisma";
import { buildTestApp } from "../helpers/test-app";
import {
  setupOrgWithUsers,
  cleanupTestContext,
  authHeaders,
  type TestOrgContext,
} from "../helpers/fixtures";

describe("GET /reports/conversion-funnel", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"]);
    [manager, repA, repB] = ctx.users;

    // repA: 2 NEW, 1 QUALIFIED, 1 CONVERTED
    await prisma.lead.createMany({
      data: [
        { organizationId: ctx.organizationId, status: "NEW", assigneeId: repA.id },
        { organizationId: ctx.organizationId, status: "NEW", assigneeId: repA.id },
        { organizationId: ctx.organizationId, status: "QUALIFIED", assigneeId: repA.id },
        { organizationId: ctx.organizationId, status: "CONVERTED", assigneeId: repA.id },
      ],
    });

    // repB: 1 DISQUALIFIED — should not count toward repA's funnel
    await prisma.lead.create({
      data: { organizationId: ctx.organizationId, status: "DISQUALIFIED", assigneeId: repB.id },
    });
  });

  afterAll(async () => {
    if (ctx) await cleanupTestContext(ctx);
  });

  it("SALES_REP only sees their own leads in the funnel", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/reports/conversion-funnel")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const stages = res.body.data.stages;
    expect(stages.find((s: any) => s.stage === "NEW").count).toBe(4); // cumulative: all 4 of repA's leads reached NEW
    expect(stages.find((s: any) => s.stage === "QUALIFIED").count).toBe(2); // QUALIFIED + CONVERTED
    expect(stages.find((s: any) => s.stage === "CONVERTED").count).toBe(1);
    expect(res.body.data.disqualifiedCount).toBe(0); // repB's disqualified lead is invisible to repA
  });

  it("SALES_MANAGER sees the whole org's funnel, including disqualified count", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/reports/conversion-funnel")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data.disqualifiedCount).toBe(1);
    expect(res.body.data.totalLeads).toBe(5); // 4 from repA + 1 disqualified from repB
  });

  it("conversion rate is null for the first stage and computed correctly for later ones", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/reports/conversion-funnel")
      .set(authHeaders(repA, ctx.organizationId));

    const stages = res.body.data.stages;
    expect(stages.find((s: any) => s.stage === "NEW").conversionRateFromPrevious).toBeNull();
    // QUALIFIED (2) from CONTACTED (0, since no leads are currently CONTACTED)
    // — this exercises the divide-by-zero guard.
    expect(stages.find((s: any) => s.stage === "QUALIFIED").conversionRateFromPrevious).toBe(100);
  });

  it("rejects unauthenticated requests", async () => {
    __setMockClerkUserId(null);
    const res = await request(app)
      .get("/api/v1/reports/conversion-funnel")
      .set("X-Organization-Id", ctx.organizationId);
    expect(res.status).toBe(401);
  });
});
