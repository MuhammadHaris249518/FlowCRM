import request from "supertest";
import { __setMockClerkUserId } from "../../__mocks__/@clerk/express";
import { buildTestApp } from "../helpers/test-app";
import {
  setupOrgWithUsers,
  cleanupTestContext,
  authHeaders,
  type TestOrgContext,
} from "../helpers/fixtures";

// Any org-scoped route works to exercise requireAuth() — GET /leads is a
// simple, side-effect-free choice.
const PROTECTED_PATH = "/api/v1/leads";

describe("requireAuth() middleware", () => {
  const app = buildTestApp();
  let ctx: TestOrgContext;

  beforeAll(async () => {
    ctx = await setupOrgWithUsers(["SALES_REP"]);
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it("rejects with 401 when there is no authenticated Clerk session", async () => {
    __setMockClerkUserId(null);

    const res = await request(app)
      .get(PROTECTED_PATH)
      .set("X-Organization-Id", ctx.organizationId);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects with 400 when X-Organization-Id header is missing", async () => {
    __setMockClerkUserId(ctx.users[0].clerkId);

    const res = await request(app).get(PROTECTED_PATH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ORGANIZATION_REQUIRED");
  });

  it("rejects with 401 when the Clerk user has no matching User row", async () => {
    __setMockClerkUserId("clerk_id_that_does_not_exist_in_db");

    const res = await request(app)
      .get(PROTECTED_PATH)
      .set("X-Organization-Id", ctx.organizationId);

    expect(res.status).toBe(401);
  });

  it("rejects with 403 when the user has no membership in the given org", async () => {
    __setMockClerkUserId(ctx.users[0].clerkId);

    const res = await request(app)
      .get(PROTECTED_PATH)
      .set("X-Organization-Id", "some-other-org-id-not-a-member-of");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("passes through to the controller when everything is valid", async () => {
    __setMockClerkUserId(ctx.users[0].clerkId);

    const res = await request(app).get(PROTECTED_PATH).set(authHeaders(ctx.users[0], ctx.organizationId));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
