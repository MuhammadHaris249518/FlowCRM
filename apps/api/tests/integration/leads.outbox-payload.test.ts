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

describe("Lead outbox payload shape (LEAD_CREATED / LEAD_STATUS_CHANGED)", () => {
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

  it("LEAD_CREATED emits a nested entity payload a CONDITION node can read", async () => {
    __setMockClerkUserId(rep.clerkId);

    const res = await request(app)
      .post("/api/v1/leads")
      .set(authHeaders(rep, ctx.organizationId))
      .send({ contactFullName: "Outbox Test Lead", source: "Referral", status: "NEW" });

    expect(res.status).toBe(201);
    const leadId = res.body.data.id;

    const event = await prisma.outboxEvent.findFirst({
      where: { organizationId: ctx.organizationId, type: "LEAD_CREATED" },
      orderBy: { createdAt: "desc" },
    });

    expect(event).not.toBeNull();
    expect((event?.payload as any).entityId).toBe(leadId);
    expect((event?.payload as any).entity.status).toBe("NEW");
    expect((event?.payload as any).entity.source).toBe("Referral");
  });

  it("LEAD_STATUS_CHANGED emits a nested entity payload with fromStatus/toStatus", async () => {
    __setMockClerkUserId(rep.clerkId);

    const contact = await createTestContact(ctx.organizationId, { fullName: "Status Change Target" });
    const lead = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contact.id,
        status: "NEW",
        assigneeId: rep.id,
      },
    });

    const res = await request(app)
      .patch(`/api/v1/leads/${lead.id}`)
      .set(authHeaders(rep, ctx.organizationId))
      .send({ status: "CONTACTED" });

    expect(res.status).toBe(200);

    const event = await prisma.outboxEvent.findFirst({
      where: { organizationId: ctx.organizationId, type: "LEAD_STATUS_CHANGED" },
      orderBy: { createdAt: "desc" },
    });

    expect(event).not.toBeNull();
    expect((event?.payload as any).entityId).toBe(lead.id);
    expect((event?.payload as any).entity.fromStatus).toBe("NEW");
    expect((event?.payload as any).entity.toStatus).toBe("CONTACTED");
  });

  it("does NOT emit LEAD_STATUS_CHANGED when status is unchanged", async () => {
    __setMockClerkUserId(rep.clerkId);

    const contact = await createTestContact(ctx.organizationId, { fullName: "No-op Target" });
    const lead = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contact.id,
        status: "NEW",
        assigneeId: rep.id,
        source: "Website Form",
      },
    });

    await request(app)
      .patch(`/api/v1/leads/${lead.id}`)
      .set(authHeaders(rep, ctx.organizationId))
      .send({ source: "Cold Call" }); // status untouched

    const events = await prisma.outboxEvent.findMany({
      where: { organizationId: ctx.organizationId, type: "LEAD_STATUS_CHANGED" },
    });
    const forThisLead = events.filter((e) => (e.payload as any).entityId === lead.id);
    expect(forThisLead).toHaveLength(0);
  });
});
