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

describe("Pipeline RBAC scoping and stage transitions", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];
  let dealForRepA: { id: string };
  let dealForRepB: { id: string };

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"]);
    [manager, repA, repB] = ctx.users;

    dealForRepA = await prisma.deal.create({
      data: {
        organizationId: ctx.organizationId,
        title: "Deal A",
        value: 5000,
        stage: "NEW",
        assigneeId: repA.id,
      },
    });

    dealForRepB = await prisma.deal.create({
      data: {
        organizationId: ctx.organizationId,
        title: "Deal B",
        value: 8000,
        stage: "NEW",
        assigneeId: repB.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("a SALES_REP only sees deals assigned to them on the board", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/pipeline/board")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const allDealIds = res.body.data.stages.flatMap((s: { deals: { id: string }[] }) =>
      s.deals.map((d) => d.id)
    );
    expect(allDealIds).toContain(dealForRepA.id);
    expect(allDealIds).not.toContain(dealForRepB.id);
  });

  it("a SALES_MANAGER sees every deal on the board", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/pipeline/board")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    const allDealIds = res.body.data.stages.flatMap((s: { deals: { id: string }[] }) =>
      s.deals.map((d) => d.id)
    );
    expect(allDealIds).toContain(dealForRepA.id);
    expect(allDealIds).toContain(dealForRepB.id);
  });

  it("a SALES_REP cannot move a deal they can't see (404, not 403 — scoping happens at lookup)", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .patch(`/api/v1/pipeline/deals/${dealForRepB.id}/stage`)
      .set(authHeaders(repA, ctx.organizationId))
      .send({ stage: "WON" });

    expect(res.status).toBe(404);
  });

  it("setting stage to WON sets closedAt, and moving back out clears it", async () => {
    __setMockClerkUserId(repA.clerkId);

    const wonRes = await request(app)
      .patch(`/api/v1/pipeline/deals/${dealForRepA.id}/stage`)
      .set(authHeaders(repA, ctx.organizationId))
      .send({ stage: "WON" });

    expect(wonRes.status).toBe(200);
    expect(wonRes.body.data.closedAt).not.toBeNull();

    const reopenRes = await request(app)
      .patch(`/api/v1/pipeline/deals/${dealForRepA.id}/stage`)
      .set(authHeaders(repA, ctx.organizationId))
      .send({ stage: "NEGOTIATION" });

    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data.closedAt).toBeNull();
  });

  it("logs a DEAL_STAGE_CHANGED activity on every stage move", async () => {
    __setMockClerkUserId(repA.clerkId);

    await request(app)
      .patch(`/api/v1/pipeline/deals/${dealForRepA.id}/stage`)
      .set(authHeaders(repA, ctx.organizationId))
      .send({ stage: "PROPOSAL" });

    const activity = await prisma.activity.findFirst({
      where: { organizationId: ctx.organizationId, type: "DEAL_STAGE_CHANGED" },
      orderBy: { createdAt: "desc" },
    });

    expect(activity).not.toBeNull();
    expect(activity?.message).toContain("PROPOSAL");
  });
});
