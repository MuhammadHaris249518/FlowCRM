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

describe("POST /leads/:id/convert", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let rep: TestOrgContext["users"][number];

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_REP"]);
    [rep] = ctx.users;
    __setMockClerkUserId(rep.clerkId);
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("marks the lead CONVERTED, creates a new NEW-stage deal, and logs an activity", async () => {
    const contact = await createTestContact(ctx.organizationId, {
      fullName: "Convertible Contact",
      ownerId: rep.id,
    });

    const lead = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contact.id,
        assigneeId: rep.id,
        status: "NEW",
      },
    });

    const res = await request(app)
      .post(`/api/v1/leads/${lead.id}/convert`)
      .set(authHeaders(rep, ctx.organizationId))
      .send({ dealTitle: "Convertible Contact — Big Deal", dealValue: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.data.lead.status).toBe("CONVERTED");
    expect(res.body.data.deal.stage).toBe("NEW");
    expect(res.body.data.deal.value).toBe(15000);
    expect(res.body.data.deal.title).toBe("Convertible Contact — Big Deal");

    // Verify against the DB directly too, not just the API response shape.
    const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updatedLead?.status).toBe("CONVERTED");

    const deal = await prisma.deal.findUnique({ where: { id: res.body.data.deal.id } });
    expect(deal).not.toBeNull();
    expect(deal?.contactId).toBe(contact.id);
    expect(deal?.assigneeId).toBe(rep.id);

    const activity = await prisma.activity.findFirst({
      where: { organizationId: ctx.organizationId, type: "DEAL_STAGE_CHANGED" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity).not.toBeNull();
    expect(activity?.message).toContain("Big Deal");
  });

  it("returns 404 converting a lead that doesn't exist", async () => {
    const res = await request(app)
      .post(`/api/v1/leads/nonexistent-id/convert`)
      .set(authHeaders(rep, ctx.organizationId))
      .send({ dealValue: 1000 });

    expect(res.status).toBe(404);
  });
});
