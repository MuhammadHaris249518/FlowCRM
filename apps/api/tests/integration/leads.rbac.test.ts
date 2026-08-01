import request from "supertest";
import { __setMockClerkUserId } from "../../__mocks__/@clerk/express";
import { prisma } from "../../src/lib/prisma";
import { buildTestApp } from "../helpers/test-app";
import {
  setupOrgWithUsers,
  cleanupTestContext,
  createTestContact,
  authHeaders,
  type TestOrgContext,
} from "../helpers/fixtures";

describe("Leads RBAC scoping", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];
  let leadForRepA: { id: string };
  let leadForRepB: { id: string };

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"]);
    [manager, repA, repB] = ctx.users;

    const contactA = await createTestContact(ctx.organizationId, { fullName: "Contact A" });
    const contactB = await createTestContact(ctx.organizationId, { fullName: "Contact B" });

    leadForRepA = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contactA.id,
        assigneeId: repA.id,
        status: "NEW",
      },
    });

    leadForRepB = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contactB.id,
        assigneeId: repB.id,
        status: "NEW",
      },
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("a SALES_REP only sees leads assigned to them", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/leads")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((item: { id: string }) => item.id);
    expect(ids).toContain(leadForRepA.id);
    expect(ids).not.toContain(leadForRepB.id);
  });

  it("a SALES_MANAGER sees every lead in the org", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/leads")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((item: { id: string }) => item.id);
    expect(ids).toContain(leadForRepA.id);
    expect(ids).toContain(leadForRepB.id);
  });

  it("a SALES_REP gets 404 fetching a lead assigned to someone else (not just an empty list)", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get(`/api/v1/leads/${leadForRepB.id}`)
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(404);
  });

  it("a SALES_REP cannot reassign their own lead to another user", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .patch(`/api/v1/leads/${leadForRepA.id}`)
      .set(authHeaders(repA, ctx.organizationId))
      .send({ assigneeId: repB.id });

    expect(res.status).toBe(403);
  });

  it("a SALES_MANAGER can reassign a lead to a different rep", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .patch(`/api/v1/leads/${leadForRepA.id}`)
      .set(authHeaders(manager, ctx.organizationId))
      .send({ assigneeId: repB.id });

    expect(res.status).toBe(200);
    expect(res.body.data.assigneeId).toBe(repB.id);

    // Restore so later tests in this file aren't affected by ordering.
    await prisma.lead.update({ where: { id: leadForRepA.id }, data: { assigneeId: repA.id } });
  });
});
