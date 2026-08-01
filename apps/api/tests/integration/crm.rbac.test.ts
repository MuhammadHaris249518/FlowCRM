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

describe("CRM RBAC scoping", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];
  let contactForRepA: { id: string };
  let contactForRepB: { id: string };
  let company: { id: string };

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"]);
    [manager, repA, repB] = ctx.users;

    company = await prisma.company.create({
      data: { organizationId: ctx.organizationId, name: "Shared Co" },
    });

    contactForRepA = await createTestContact(ctx.organizationId, {
      fullName: "Contact A",
      ownerId: repA.id,
    });

    contactForRepB = await createTestContact(ctx.organizationId, {
      fullName: "Contact B",
      ownerId: repB.id,
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("Companies are visible org-wide to every role, including SALES_REP", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/crm/companies")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((c: { id: string }) => c.id);
    expect(ids).toContain(company.id);
  });

  it("a SALES_REP only sees contacts they own", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/crm/contacts")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((c: { id: string }) => c.id);
    expect(ids).toContain(contactForRepA.id);
    expect(ids).not.toContain(contactForRepB.id);
  });

  it("a SALES_MANAGER sees every contact in the org", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/crm/contacts")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((c: { id: string }) => c.id);
    expect(ids).toContain(contactForRepA.id);
    expect(ids).toContain(contactForRepB.id);
  });

  it("a SALES_REP cannot fetch a contact they don't own (404)", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get(`/api/v1/crm/contacts/${contactForRepB.id}`)
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(404);
  });

  it("a SALES_REP cannot delete a contact they don't own (404)", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .delete(`/api/v1/crm/contacts/${contactForRepB.id}`)
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(404);
  });

  it("a new contact created by a SALES_REP is auto-owned by them", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .post("/api/v1/crm/contacts")
      .set(authHeaders(repA, ctx.organizationId))
      .send({ fullName: "Auto Owned Contact" });

    expect(res.status).toBe(201);
    expect(res.body.data.ownerId).toBe(repA.id);
  });
});
