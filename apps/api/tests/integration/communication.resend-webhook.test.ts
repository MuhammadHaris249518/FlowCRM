import request from "supertest";
import { prisma } from "../../src/lib/prisma";
import { buildTestApp } from "../helpers/test-app";
import { setupOrgWithUsers, cleanupTestContext, type TestOrgContext } from "../helpers/fixtures";

jest.mock("svix", () => ({ Webhook: jest.fn() }));
import { Webhook } from "svix";
const MockedWebhookCtor = Webhook as unknown as jest.Mock;

describe("POST /webhooks/resend", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let originalSecret: string | undefined;
  let originalOrgId: string | undefined;

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_REP"]);
    originalSecret = process.env.RESEND_WEBHOOK_SECRET;
    originalOrgId = process.env.DEFAULT_ORG_ID_FOR_INBOUND_EMAIL;
    // Real value doesn't matter — Webhook.verify() is mocked below — but it
    // must be truthy or the route's own "not configured" check fires first.
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test_dummy";
    process.env.DEFAULT_ORG_ID_FOR_INBOUND_EMAIL = ctx.organizationId;
  });

  afterAll(async () => {
    process.env.RESEND_WEBHOOK_SECRET = originalSecret;
    process.env.DEFAULT_ORG_ID_FOR_INBOUND_EMAIL = originalOrgId;
    if (ctx) await cleanupTestContext(ctx);
  });

  function postWebhook(body: object) {
    return request(app)
      .post("/api/v1/webhooks/resend")
      .set("Content-Type", "application/json")
      .set("svix-id", "msg_test123")
      .set("svix-timestamp", String(Math.floor(Date.now() / 1000)))
      .set("svix-signature", "v1,test_signature_value")
      .send(JSON.stringify(body));
  }

  it("records an inbound Message and EMAIL_RECEIVED Activity on a validly-signed email.received event", async () => {
    const senderEmail = `inbound-${Date.now()}@example.com`;
    const contact = await prisma.contact.create({
      data: { organizationId: ctx.organizationId, fullName: "Inbound Sender", email: senderEmail },
    });

    MockedWebhookCtor.mockImplementation(() => ({
      verify: jest.fn().mockReturnValue({
        type: "email.received",
        data: { from: senderEmail, to: "inbox@yourapp.resend.app", subject: "Re: Following up", text: "Sounds good!" },
      }),
    }));

    const res = await postWebhook({ type: "email.received" }); // body content is irrelevant, verify() is mocked
    expect(res.status).toBe(200);

    const message = await prisma.message.findFirst({
      where: { organizationId: ctx.organizationId, direction: "INBOUND", fromAddress: senderEmail },
      orderBy: { createdAt: "desc" },
    });
    expect(message).not.toBeNull();
    expect(message?.contactId).toBe(contact.id); // correlated by sender email
    expect(message?.status).toBe("RECEIVED");

    const activity = await prisma.activity.findFirst({
      where: { organizationId: ctx.organizationId, type: "EMAIL_RECEIVED" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity).not.toBeNull();
  });

  it("rejects a request with an invalid signature and creates no Message", async () => {
    MockedWebhookCtor.mockImplementation(() => ({
      verify: jest.fn(() => {
        throw new Error("signature mismatch");
      }),
    }));

    const before = await prisma.message.count({ where: { organizationId: ctx.organizationId } });
    const res = await postWebhook({ type: "email.received" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SIGNATURE");
    const after = await prisma.message.count({ where: { organizationId: ctx.organizationId } });
    expect(after).toBe(before);
  });

  it("rejects a request missing the svix headers", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/resend")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "email.received" })); // no svix-* headers set at all

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_WEBHOOK");
  });

  it("skips non-email.received event types without error", async () => {
    MockedWebhookCtor.mockImplementation(() => ({
      verify: jest.fn().mockReturnValue({ type: "email.delivered", data: {} }),
    }));

    const before = await prisma.message.count({ where: { organizationId: ctx.organizationId } });
    const res = await postWebhook({ type: "email.delivered" });

    expect(res.status).toBe(200);
    expect(res.body.skipped).toBe("email.delivered");
    const after = await prisma.message.count({ where: { organizationId: ctx.organizationId } });
    expect(after).toBe(before);
  });

  it("returns 400 WEBHOOK_MISCONFIGURED when RESEND_WEBHOOK_SECRET isn't set", async () => {
    const saved = process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.RESEND_WEBHOOK_SECRET;
    try {
      const res = await postWebhook({ type: "email.received" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("WEBHOOK_MISCONFIGURED");
    } finally {
      process.env.RESEND_WEBHOOK_SECRET = saved;
    }
  });
});
