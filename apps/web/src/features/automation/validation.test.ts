import { describe, it, expect } from "vitest";
import { validateWorkflowGraph, workflowNameSchema } from "./validation";

const trigger = { id: "t1", type: "TRIGGER" as const, config: { trigger: "LEAD_CREATED" } };
const action = {
  id: "a1",
  type: "ACTION_STATIC" as const,
  config: { action: "CREATE_TASK", title: "Follow up", priority: "MEDIUM" },
};

describe("workflowNameSchema", () => {
  it("rejects an empty name", () => {
    expect(workflowNameSchema.safeParse("   ").success).toBe(false);
  });

  it("accepts a trimmed valid name", () => {
    expect(workflowNameSchema.safeParse("New Lead Follow-up").success).toBe(true);
  });
});

describe("validateWorkflowGraph", () => {
  it("requires at least one node", () => {
    const errors = validateWorkflowGraph({ name: "Empty", nodes: [], edges: [] });
    expect(errors).toContain("Add at least one node to save this workflow.");
  });

  it("requires exactly one trigger node", () => {
    const noTrigger = validateWorkflowGraph({ name: "No trigger", nodes: [action], edges: [] });
    expect(noTrigger.some((e) => e.includes("exactly one Trigger"))).toBe(true);

    const twoTriggers = validateWorkflowGraph({
      name: "Two triggers",
      nodes: [trigger, { ...trigger, id: "t2" }],
      edges: [],
    });
    expect(twoTriggers.some((e) => e.includes("only have one Trigger"))).toBe(true);
  });

  it("passes a minimal valid connected graph with no errors", () => {
    const errors = validateWorkflowGraph({
      name: "Valid graph",
      nodes: [trigger, action],
      edges: [{ sourceNodeId: "t1", targetNodeId: "a1" }],
    });
    expect(errors).toEqual([]);
  });

  it("flags a node with a config that doesn't match its type's schema", () => {
    const badAction = { id: "a1", type: "ACTION_STATIC" as const, config: { action: "CREATE_TASK" } }; // missing title/priority
    const errors = validateWorkflowGraph({
      name: "Bad config",
      nodes: [trigger, badAction],
      edges: [{ sourceNodeId: "t1", targetNodeId: "a1" }],
    });
    expect(errors.some((e) => e.includes("misconfigured"))).toBe(true);
  });

  it("flags an edge pointing at a self-loop or a missing node", () => {
    const selfLoop = validateWorkflowGraph({
      name: "Self loop",
      nodes: [trigger, action],
      edges: [{ sourceNodeId: "a1", targetNodeId: "a1" }],
    });
    expect(selfLoop.some((e) => e.includes("connect to itself"))).toBe(true);

    const dangling = validateWorkflowGraph({
      name: "Dangling edge",
      nodes: [trigger, action],
      edges: [{ sourceNodeId: "t1", targetNodeId: "does-not-exist" }],
    });
    expect(dangling.some((e) => e.includes("no longer exists"))).toBe(true);
  });

  it("flags a node that is unreachable from the trigger", () => {
    const orphan = { ...action, id: "orphan" };
    const errors = validateWorkflowGraph({
      name: "Orphan node",
      nodes: [trigger, action, orphan],
      edges: [{ sourceNodeId: "t1", targetNodeId: "a1" }],
    });
    expect(errors.some((e) => e.includes("not connected to the Trigger"))).toBe(true);
  });
});
