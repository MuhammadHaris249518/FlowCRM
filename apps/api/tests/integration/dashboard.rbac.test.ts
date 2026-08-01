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

describe("Dashboard RBAC scoping", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"]);
    [manager, repA, repB] = ctx.users;

    // Won deal for each rep this month — feeds both summary revenue and
    // pipeline-overview's WON stage total.
    await prisma.deal.create({
      data: {
        organizationId: ctx.organizationId,
        title: "Deal A",
        value: 5000,
        stage: "WON",
        assigneeId: repA.id,
        closedAt: new Date(),
      },
    });

    await prisma.deal.create({
      data: {
        organizationId: ctx.organizationId,
        title: "Deal B",
        value: 9000,
        stage: "WON",
        assigneeId: repB.id,
        closedAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        organizationId: ctx.organizationId,
        type: "NOTE_ADDED",
        message: "Activity visible to the whole team",
        actorId: repB.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("a SALES_REP's summary revenue only reflects their own deals", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data.stats.revenue.value).toBe(5000);
  });

  it("a SALES_MANAGER's summary revenue reflects the whole org", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data.stats.revenue.value).toBe(14000);
  });

  it("a SALES_REP's pipeline-overview only includes their own deals", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/dashboard/pipeline-overview")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const wonStage = res.body.data.stages.find((s: { stage: string }) => s.stage === "WON");
    expect(wonStage.totalValue).toBe(5000);
  });

  it("recent-activities is org-wide for every role, including SALES_REP", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/dashboard/recent-activities")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const messages = res.body.data.map((a: { message: string }) => a.message);
    expect(messages).toContain("Activity visible to the whole team");
  });
});
