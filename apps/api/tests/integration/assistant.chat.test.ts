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
import { aiServiceClient } from "../../src/lib/ai-service-client";

jest.mock("../../src/lib/ai-service-client", () => ({
  aiServiceClient: {
    assistantChat: jest.fn(),
    createEmailDraft: jest.fn(),
    getEmailDraftStatus: jest.fn(),
    scoreLead: jest.fn().mockResolvedValue({
      score: 88,
      reasoning: "Complete contact and a clear budget in the notes.",
    }),
  },
}));

const mockedAi = aiServiceClient as jest.Mocked<typeof aiServiceClient>;

describe("POST /api/v1/assistant/chat", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let otherCtx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let rep: TestOrgContext["users"][number];
  let otherRep: TestOrgContext["users"][number];
  let highScoreLead: { id: string };

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP"]);
    [manager, rep] = ctx.users;
    otherCtx = await setupOrgWithUsers(["SALES_REP"]);
    [otherRep] = otherCtx.users;

    const contact = await createTestContact(ctx.organizationId, {
      fullName: "Amina Khan",
      ownerId: manager.id,
    });
    await prisma.contact.update({
      where: { id: contact.id },
      data: { email: "amina@northwind.test" },
    });

    highScoreLead = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        contactId: contact.id,
        source: "Referral",
        notes: "Budget confirmed, wants a 20-seat rollout this quarter.",
        score: 91,
        assigneeId: manager.id,
      },
    });

    const otherContact = await createTestContact(otherCtx.organizationId, {
      fullName: "Other Org Lead",
      ownerId: otherRep.id,
    });
    await prisma.lead.create({
      data: {
        organizationId: otherCtx.organizationId,
        contactId: otherContact.id,
        score: 99,
        assigneeId: otherRep.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
    await cleanupTestContext(otherCtx);
  });

  beforeEach(() => {
    mockedAi.assistantChat.mockReset();
    mockedAi.createEmailDraft.mockReset();
    mockedAi.getEmailDraftStatus.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/v1/assistant/chat")
      .send({ messages: [{ role: "user", content: "Who are my best leads?" }] });

    expect(res.status).toBe(401);
  });

  it("rejects a payload whose last message is not from the user", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .post("/api/v1/assistant/chat")
      .set(authHeaders(manager, ctx.organizationId))
      .send({ messages: [{ role: "assistant", content: "Hello" }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("executes search_leads against live org data and returns the model reply", async () => {
    __setMockClerkUserId(manager.clerkId);

    mockedAi.assistantChat
      .mockResolvedValueOnce({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_search",
            name: "search_leads",
            arguments: { sortBy: "score", limit: 5 },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "Your best target is Amina Khan at score 91.",
        tool_calls: null,
      });

    const res = await request(app)
      .post("/api/v1/assistant/chat")
      .set(authHeaders(manager, ctx.organizationId))
      .send({ messages: [{ role: "user", content: "Who are my best target leads?" }] });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toContain("Amina Khan");

    const secondCallMessages = mockedAi.assistantChat.mock.calls[1][0].messages;
    const toolResult = secondCallMessages.find((m) => m.role === "tool");
    expect(toolResult).toBeDefined();
    const parsed = JSON.parse(toolResult!.content as string) as Array<{ contactName: string; score: number }>;
    expect(parsed.some((row) => row.contactName === "Amina Khan" && row.score === 91)).toBe(true);
    expect(parsed.some((row) => row.contactName === "Other Org Lead")).toBe(false);
  });

  it("does not leak another organization's leads to a sales rep in this org", async () => {
    __setMockClerkUserId(rep.clerkId);

    mockedAi.assistantChat
      .mockResolvedValueOnce({
        role: "assistant",
        content: null,
        tool_calls: [{ id: "call_search", name: "search_leads", arguments: { sortBy: "score" } }],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "You have no high-scoring leads assigned to you.",
        tool_calls: null,
      });

    const res = await request(app)
      .post("/api/v1/assistant/chat")
      .set(authHeaders(rep, ctx.organizationId))
      .send({ messages: [{ role: "user", content: "Best leads?" }] });

    expect(res.status).toBe(200);

    const toolResult = mockedAi.assistantChat.mock.calls[1][0].messages.find((m) => m.role === "tool");
    const parsed = JSON.parse(toolResult!.content as string) as Array<{ id: string }>;
    expect(parsed.find((row) => row.id === highScoreLead.id)).toBeUndefined();
  });

  it("drafts email via Groq, stores a DRAFT message, and never marks it sent", async () => {
    __setMockClerkUserId(manager.clerkId);

    mockedAi.createEmailDraft.mockResolvedValue({ jobId: "job_1", status: "pending" });
    mockedAi.getEmailDraftStatus.mockResolvedValue({
      jobId: "job_1",
      status: "completed",
      result: {
        subject: "Following up on the 20-seat rollout",
        body: "Hi Amina, circling back on timing for this quarter.",
        revisionCount: 1,
        finalFeedback: "Approved",
      },
      error: null,
    });

    mockedAi.assistantChat
      .mockResolvedValueOnce({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_draft",
            name: "draft_email",
            arguments: {
              leadId: highScoreLead.id,
              instructions: "Short follow-up on the rollout timeline.",
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "I drafted a follow-up. It is waiting for your review and was not sent.",
        tool_calls: null,
      });

    const res = await request(app)
      .post("/api/v1/assistant/chat")
      .set(authHeaders(manager, ctx.organizationId))
      .send({
        messages: [{ role: "user", content: "Draft a follow-up for Amina. Do not send it." }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].type).toBe("email_draft");
    expect(res.body.data.actions[0].subject).toBe("Following up on the 20-seat rollout");

    const message = await prisma.message.findUnique({
      where: { id: res.body.data.actions[0].messageId },
    });
    expect(message?.status).toBe("DRAFT");
    expect(message?.sentAt).toBeNull();
    expect(mockedAi.createEmailDraft).toHaveBeenCalled();
  });
});
