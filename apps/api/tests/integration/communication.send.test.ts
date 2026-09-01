import request from "supertest";
import { __setMockClerkUserId } from "../../__mocks__/@clerk/express";
import { prisma } from "../../src/lib/prisma";
import { resendClient } from "../../src/lib/resend-client";
import { buildTestApp } from "../helpers/test-app";
import {
  setupOrgWithUsers,
  cleanupTestContext,
  authHeaders,
  createTestContact,
  type TestOrgContext,
} from "../helpers/fixtures";

jest.mock("../../src/lib/resend-client");

describe("POST /communication/messages/:id/send", () => {
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

  async function createDraftMessage(overrides: Partial<{ toAddress: string | null }> = {}) {
    const contact = await createTestContact(ctx.organizationId, { fullName: "Send Target" });
    const lead = await prisma.lead.create({
      data: { organizationId: ctx.organizationId, contactId: contact.id, status: "NEW" },
    });
    return prisma.message.create({
      data: {
        organizationId: ctx.organizationId,
        leadId: lead.id,
        channel: "EMAIL",
        direction: "OUTBOUND",
        status: "DRAFT",
        subject: "Following up",
        body: "Hi — just checking in.",
        toAddress: overrides.toAddress === undefined ? "target@example.com" : overrides.toAddress,
      },
    });
  }

  it("sends a draft, marks it SENT, logs an EMAIL_SENT Activity, and completes the linked Task", async () => {
    __setMockClerkUserId(rep.clerkId);
    (resendClient.sendEmail as jest.Mock).mockResolvedValue({ externalId: "resend_abc123" });

    const message = await createDraftMessage();
    const task = await prisma.task.create({
      data: {
        organizationId: ctx.organizationId,
        title: "Review AI-drafted email",
        priority: "MEDIUM",
        messageId: message.id,
        leadId: message.leadId,
      },
    });

    const res = await request(app)
      .post(`/api/v1/communication/messages/${message.id}/send`)
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("SENT");

    const updated = await prisma.message.findUnique({ where: { id: message.id } });
    expect(updated?.status).toBe("SENT");
    expect(updated?.externalId).toBe("resend_abc123");
    expect(updated?.sentAt).not.toBeNull();

    const activity = await prisma.activity.findFirst({
      where: { organizationId: ctx.organizationId, type: "EMAIL_SENT" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity).not.toBeNull();
    expect(activity?.message).toContain("Following up");

    const updatedTask = await prisma.task.findUnique({ where: { id: task.id } });
    expect(updatedTask?.completedAt).not.toBeNull();
  });

  it("rejects sending a message that isn't a DRAFT (NOT_A_DRAFT)", async () => {
    __setMockClerkUserId(rep.clerkId);
    const message = await createDraftMessage();
    await prisma.message.update({ where: { id: message.id }, data: { status: "SENT" } });

    const res = await request(app)
      .post(`/api/v1/communication/messages/${message.id}/send`)
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOT_A_DRAFT");
    expect(resendClient.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects sending a message with no recipient (MISSING_RECIPIENT)", async () => {
    __setMockClerkUserId(rep.clerkId);
    const message = await createDraftMessage({ toAddress: null });

    const res = await request(app)
      .post(`/api/v1/communication/messages/${message.id}/send`)
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_RECIPIENT");
    expect(resendClient.sendEmail).not.toHaveBeenCalled();
  });

  it("marks the message FAILED (not left as DRAFT) when the provider call throws", async () => {
    __setMockClerkUserId(rep.clerkId);
    (resendClient.sendEmail as jest.Mock).mockRejectedValue(new Error("Resend send failed (500): timeout"));

    const message = await createDraftMessage();

    const res = await request(app)
      .post(`/api/v1/communication/messages/${message.id}/send`)
      .set(authHeaders(rep, ctx.organizationId));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SEND_FAILED");

    const updated = await prisma.message.findUnique({ where: { id: message.id } });
    expect(updated?.status).toBe("FAILED");
    expect(updated?.errorMessage).toContain("timeout");
  });

  it("does not let a user from a different org send or even find another org's message (404)", async () => {
    const otherCtx = await setupOrgWithUsers(["SALES_REP"]);
    try {
      const message = await createDraftMessage();
      __setMockClerkUserId(otherCtx.users[0].clerkId);

      const res = await request(app)
        .post(`/api/v1/communication/messages/${message.id}/send`)
        .set(authHeaders(otherCtx.users[0], otherCtx.organizationId));

      expect(res.status).toBe(404);
      expect(resendClient.sendEmail).not.toHaveBeenCalled();
    } finally {
      await cleanupTestContext(otherCtx);
    }
  });

  it("requires authentication", async () => {
    __setMockClerkUserId(null);
    const message = await createDraftMessage();
    const res = await request(app).post(`/api/v1/communication/messages/${message.id}/send`);
    expect(res.status).toBe(401);
  });
});
