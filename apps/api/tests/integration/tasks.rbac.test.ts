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

describe("Tasks RBAC scoping and completion", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;
  let manager: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];
  let taskForRepA: { id: string };
  let taskForRepB: { id: string };

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"]);
    [manager, repA, repB] = ctx.users;

    taskForRepA = await prisma.task.create({
      data: { organizationId: ctx.organizationId, title: "Task A", assigneeId: repA.id },
    });

    taskForRepB = await prisma.task.create({
      data: { organizationId: ctx.organizationId, title: "Task B", assigneeId: repB.id },
    });
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("a SALES_REP only sees tasks assigned to them", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .get("/api/v1/tasks")
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((t: { id: string }) => t.id);
    expect(ids).toContain(taskForRepA.id);
    expect(ids).not.toContain(taskForRepB.id);
  });

  it("a SALES_MANAGER sees every task", async () => {
    __setMockClerkUserId(manager.clerkId);

    const res = await request(app)
      .get("/api/v1/tasks")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((t: { id: string }) => t.id);
    expect(ids).toContain(taskForRepA.id);
    expect(ids).toContain(taskForRepB.id);
  });

  it("a SALES_REP cannot act on a task they can't see (404)", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .patch(`/api/v1/tasks/${taskForRepB.id}/complete`)
      .set(authHeaders(repA, ctx.organizationId));

    expect(res.status).toBe(404);
  });

  it("completing a task sets completedAt and logs a TASK_COMPLETED activity", async () => {
    __setMockClerkUserId(repA.clerkId);

    const completeRes = await request(app)
      .patch(`/api/v1/tasks/${taskForRepA.id}/complete`)
      .set(authHeaders(repA, ctx.organizationId));

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.completedAt).not.toBeNull();

    const activity = await prisma.activity.findFirst({
      where: { organizationId: ctx.organizationId, type: "TASK_COMPLETED" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity).not.toBeNull();

    const reopenRes = await request(app)
      .patch(`/api/v1/tasks/${taskForRepA.id}/reopen`)
      .set(authHeaders(repA, ctx.organizationId));

    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data.completedAt).toBeNull();
  });

  it("a SALES_REP cannot reassign a task to another user", async () => {
    __setMockClerkUserId(repA.clerkId);

    const res = await request(app)
      .patch(`/api/v1/tasks/${taskForRepA.id}`)
      .set(authHeaders(repA, ctx.organizationId))
      .send({ assigneeId: repB.id });

    expect(res.status).toBe(403);
  });
});
