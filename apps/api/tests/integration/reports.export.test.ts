import request from "supertest";
import { __setMockClerkUserId } from "../../__mocks__/@clerk/express";
import { buildTestApp } from "../helpers/test-app";
import { setupOrgWithUsers, cleanupTestContext, authHeaders, type TestOrgContext } from "../helpers/fixtures";

describe("GET /reports/*/export", () => {
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

  it("returns CSV content-type and attachment header for conversion funnel", async () => {
    __setMockClerkUserId(manager.clerkId);
    const res = await request(app)
      .get("/api/v1/reports/conversion-funnel/export")
      .set(authHeaders(manager, ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.text).toContain("Stage,Count");
  });

  it("returns CSV for win-loss export", async () => {
    __setMockClerkUserId(manager.clerkId);
    const res = await request(app)
      .get("/api/v1/reports/win-loss/export")
      .set(authHeaders(manager, ctx.organizationId));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
  });

  it("returns CSV for trends export", async () => {
    __setMockClerkUserId(manager.clerkId);
    const res = await request(app)
      .get("/api/v1/reports/trends/export")
      .set(authHeaders(manager, ctx.organizationId));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
  });

  it("rejects unauthenticated export requests", async () => {
    const res = await request(app).get("/api/v1/reports/conversion-funnel/export");
    expect(res.status).toBe(401);
  });
});
