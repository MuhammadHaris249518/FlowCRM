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

describe("PATCH /pipeline/deals/:id/stage — lostReason", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER"]);
    [manager] = ctx.users;
  });

  afterAll(async () => {
    if (ctx) await cleanupTestContext(ctx);
  });

  it("rejects moving a deal to LOST without a lostReason", async () => {
    __setMockClerkUserId(manager.clerkId);
    const deal = await prisma.deal.create({
      data: { organizationId: ctx.organizationId, title: "No reason deal", value: 100, stage: "NEW" },
    });

    const res = await request(app)
      .patch(`/api/v1/pipeline/deals/${deal.id}/stage`)
      .set(authHeaders(manager, ctx.organizationId))
      .send({ stage: "LOST" });

    expect(res.status).toBe(400);
  });

  it("clears lostReason when a lost deal is reopened", async () => {
    __setMockClerkUserId(manager.clerkId);
    const deal = await prisma.deal.create({
      data: { organizationId: ctx.organizationId, title: "Reopen test", value: 100, stage: "NEW" },
    });

    await request(app)
      .patch(`/api/v1/pipeline/deals/${deal.id}/stage`)
      .set(authHeaders(manager, ctx.organizationId))
      .send({ stage: "LOST", lostReason: "TIMING" });

    const res = await request(app)
      .patch(`/api/v1/pipeline/deals/${deal.id}/stage`)
      .set(authHeaders(manager, ctx.organizationId))
      .send({ stage: "NEW" });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe("NEW");

    const reloaded = await prisma.deal.findUnique({ where: { id: deal.id } });
    expect(reloaded?.lostReason).toBeNull();
  });
});
