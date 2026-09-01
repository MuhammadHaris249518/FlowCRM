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

describe("GET /communication/messages", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let rep: TestOrgContext["users"][number];

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_REP"]);
    [rep] = ctx.users;
  });

  afterAll(async () => {
    if (ctx) await cleanupTestContext(ctx);
  });

  it("returns messages for a lead, newest first", async () => {
    __setMockClerkUserId(rep.clerkId);
    const contact = await createTestContact(ctx.organizationId, { fullName: "Thread Target" });
    const lead = await prisma.lead.create({
      data: { organizationId: ctx.organizationId, contactId: contact.id, status: "NEW" },
    });

    const first = await prisma.message.create({
      data: {
        organizationId: ctx.organizationId, leadId: lead.id, channel: "EMAIL",
        direction: "OUTBOUND", status: "SENT", body: "First message", toAddress: "a@b.com",
      },
    });
    await new Promise((r) => setTimeout(r, 5)); // ensure createdAt ordering is unambiguous
    const second = await prisma.message.create({
      data: {
        organizationId: ctx.organizationId, leadId: lead.id, channel: "EMAIL",
        direction: "INBOUND", status: "RECEIVED", body: "Second message", fromAddress: "a@b.com",
      },
    });

    const res = await request(app)
      .get("/api/v1/communication/messages")
      .query({ leadId: lead.id })
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe(second.id); // newest first
    expect(res.body.data[1].id).toBe(first.id);
  });

  it("requires contactId or leadId", async () => {
    __setMockClerkUserId(rep.clerkId);
    const res = await request(app)
      .get("/api/v1/communication/messages")
      .set(authHeaders(rep, ctx.organizationId));
    expect(res.status).toBe(400);
  });

  it("respects the limit param", async () => {
    __setMockClerkUserId(rep.clerkId);
    const contact = await createTestContact(ctx.organizationId, { fullName: "Limit Target" });
    const lead = await prisma.lead.create({
      data: { organizationId: ctx.organizationId, contactId: contact.id, status: "NEW" },
    });
    for (let i = 0; i < 3; i++) {
      await prisma.message.create({
        data: {
          organizationId: ctx.organizationId, leadId: lead.id, channel: "EMAIL",
          direction: "OUTBOUND", status: "SENT", body: `Message ${i}`, toAddress: "a@b.com",
        },
      });
    }

    const res = await request(app)
      .get("/api/v1/communication/messages")
      .query({ leadId: lead.id, limit: 2 })
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("does not leak another org's messages for a matching leadId", async () => {
    const otherCtx = await setupOrgWithUsers(["SALES_REP"]);
    try {
      __setMockClerkUserId(otherCtx.users[0].clerkId);
      const contact = await createTestContact(otherCtx.organizationId, { fullName: "Other Org Target" });
      const lead = await prisma.lead.create({
        data: { organizationId: otherCtx.organizationId, contactId: contact.id, status: "NEW" },
      });
      await prisma.message.create({
        data: {
          organizationId: otherCtx.organizationId, leadId: lead.id, channel: "EMAIL",
          direction: "OUTBOUND", status: "SENT", body: "Should not be visible", toAddress: "a@b.com",
        },
      });

      __setMockClerkUserId(rep.clerkId);
      const res = await request(app)
        .get("/api/v1/communication/messages")
        .query({ leadId: lead.id }) // a lead id that belongs to the OTHER org
        .set(authHeaders(rep, ctx.organizationId));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    } finally {
      await cleanupTestContext(otherCtx);
    }
  });
});
