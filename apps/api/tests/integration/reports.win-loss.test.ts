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

describe("GET /reports/win-loss", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP"]);
    [manager, repA] = ctx.users;

    await prisma.deal.createMany({
      data: [
        { organizationId: ctx.organizationId, title: "Won 1", value: 1000, stage: "WON", assigneeId: repA.id, closedAt: new Date() },
        { organizationId: ctx.organizationId, title: "Lost 1", value: 500, stage: "LOST", assigneeId: repA.id, closedAt: new Date(), lostReason: "BUDGET" },
        { organizationId: ctx.organizationId, title: "Lost 2", value: 300, stage: "LOST", assigneeId: repA.id, closedAt: new Date(), lostReason: "BUDGET" },
      ],
    });
  });

  afterAll(async () => {
    if (ctx) await cleanupTestContext(ctx);
  });

  it("computes win rate and groups lost reasons correctly", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/reports/win-loss")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data.totalWon).toBe(1);
    expect(res.body.data.totalLost).toBe(2);
    expect(res.body.data.overallWinRate).toBe(33.3);

    const budgetRow = res.body.data.byLostReason.find((r: any) => r.reason === "BUDGET");
    expect(budgetRow.count).toBe(2);
    expect(budgetRow.value).toBe(800);
  });
});
