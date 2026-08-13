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
import { automationRepository } from "../../src/modules/automation/automation.repository";

describe("Workflow Automation RBAC & Repository Scoping", () => {
  const app = buildTestApp();
  let orgA: TestOrgContext;
  let orgB: TestOrgContext;
  let managerA: TestOrgContext["users"][number];
  let repA: TestOrgContext["users"][number];
  let repB: TestOrgContext["users"][number];
  let workflowA: { id: string };
  let workflowB: { id: string };

  beforeAll(async () => {
    orgA = await setupOrgWithUsers(["SALES_MANAGER", "SALES_REP"]);
    orgB = await setupOrgWithUsers(["SALES_REP"]);
    [managerA, repA] = orgA.users;
    [repB] = orgB.users;

    const nodeA = await prisma.workflowNode.create({
      data: {
        workflow: {
          create: {
            name: "Org A Workflow",
            organizationId: orgA.organizationId,
            isActive: true,
          },
        },
        type: "TRIGGER",
        config: { trigger: "LEAD_CREATED" },
      },
    });
    workflowA = { id: nodeA.workflowId };

    const nodeB = await prisma.workflowNode.create({
      data: {
        workflow: {
          create: {
            name: "Org B Workflow",
            organizationId: orgB.organizationId,
            isActive: true,
          },
        },
        type: "TRIGGER",
        config: { trigger: "LEAD_CREATED" },
      },
    });
    workflowB = { id: nodeB.workflowId };
  });

  afterAll(async () => {
    await cleanupTestContext(orgA);
    await cleanupTestContext(orgB);
  });

  it("1. A user in Org A cannot fetch, update, or delete a Workflow belonging to Org B (returns 404)", async () => {
    __setMockClerkUserId(managerA.clerkId);

    const getRes = await request(app)
      .get(`/api/v1/automation/${workflowB.id}`)
      .set(authHeaders(managerA, orgA.organizationId));
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/automation/${workflowB.id}`)
      .set(authHeaders(managerA, orgA.organizationId))
      .send({ name: "Hacked Workflow" });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/automation/${workflowB.id}`)
      .set(authHeaders(managerA, orgA.organizationId));
    expect(deleteRes.status).toBe(404);
  });

  it("2. Creating a Workflow with an edge referencing a non-existent nodeId throws", async () => {
    const auth = {
      userId: repA.id,
      clerkId: repA.clerkId,
      organizationId: orgA.organizationId,
      role: repA.role,
    };

    await expect(
      automationRepository.create(auth, {
        name: "Invalid Edge Workflow",
        isActive: false,
        nodes: [
          {
            id: "node-1",
            type: "TRIGGER",
            config: { trigger: "LEAD_CREATED" },
            positionX: 0,
            positionY: 0,
          },
        ],
        edges: [
          {
            sourceNodeId: "node-1",
            targetNodeId: "non-existent-node",
          },
        ],
      })
    ).rejects.toThrow("Edge references unknown node id");
  });

  it("3. findActiveWorkflowsForTrigger only returns active workflows for the organization", async () => {
    const inactiveWf = await prisma.workflow.create({
      data: {
        name: "Inactive Workflow",
        organizationId: orgA.organizationId,
        isActive: false,
        nodes: {
          create: [
            {
              type: "TRIGGER",
              config: { trigger: "LEAD_CREATED" },
            },
          ],
        },
      },
    });

    const activeWorkflows = await automationRepository.findActiveWorkflowsForTrigger(
      orgA.organizationId,
      "LEAD_CREATED"
    );

    const ids = activeWorkflows.map((w) => w.id);
    expect(ids).toContain(workflowA.id);
    expect(ids).not.toContain(workflowB.id);
    expect(ids).not.toContain(inactiveWf.id);

    await prisma.workflow.delete({ where: { id: inactiveWf.id } });
  });

  describe("Role gate on mutating workflow routes", () => {
    it("a SALES_REP gets 403 creating a workflow", async () => {
      __setMockClerkUserId(repA.clerkId);

      const res = await request(app)
        .post("/api/v1/automation")
        .set(authHeaders(repA, orgA.organizationId))
        .send({
          name: "Rep Attempted Workflow",
          isActive: false,
          nodes: [{ id: "n1", type: "TRIGGER", config: { trigger: "LEAD_CREATED" }, positionX: 0, positionY: 0 }],
          edges: [],
        });

      expect(res.status).toBe(403);
    });

    it("a SALES_REP gets 403 updating a workflow", async () => {
      __setMockClerkUserId(repA.clerkId);

      const res = await request(app)
        .patch(`/api/v1/automation/${workflowA.id}`)
        .set(authHeaders(repA, orgA.organizationId))
        .send({ name: "Renamed by rep" });

      expect(res.status).toBe(403);
    });

    it("a SALES_REP gets 403 deleting a workflow", async () => {
      __setMockClerkUserId(repA.clerkId);

      const res = await request(app)
        .delete(`/api/v1/automation/${workflowA.id}`)
        .set(authHeaders(repA, orgA.organizationId));

      expect(res.status).toBe(403);
    });

    it("a SALES_REP still gets 200 on read-only routes (list/getById)", async () => {
      __setMockClerkUserId(repA.clerkId);

      const listRes = await request(app)
        .get("/api/v1/automation")
        .set(authHeaders(repA, orgA.organizationId));
      expect(listRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/automation/${workflowA.id}`)
        .set(authHeaders(repA, orgA.organizationId));
      expect(getRes.status).toBe(200);
    });
  });
});
