import { describe, it, expect } from "vitest";
import { dtoToFlow, flowToPayload, generateNodeId } from "./graph-transform";
import type { WorkflowDTO } from "../types";

const sampleDto: WorkflowDTO = {
  id: "wf1",
  name: "Sample",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  nodes: [
    { id: "n1", type: "TRIGGER", config: { trigger: "LEAD_CREATED" }, positionX: 10, positionY: 20 },
    {
      id: "n2",
      type: "ACTION_STATIC",
      config: { action: "CREATE_TASK", title: "Follow up", priority: "MEDIUM" },
      positionX: 300,
      positionY: 20,
    },
  ],
  edges: [{ id: "e1", sourceNodeId: "n1", targetNodeId: "n2", label: null }],
};

describe("dtoToFlow", () => {
  it("maps nodes preserving id, type, position and config", () => {
    const { nodes } = dtoToFlow(sampleDto);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({
      id: "n1",
      type: "TRIGGER",
      position: { x: 10, y: 20 },
      data: { nodeType: "TRIGGER", config: { trigger: "LEAD_CREATED" } },
    });
  });

  it("maps edges from sourceNodeId/targetNodeId to source/target, dropping null labels", () => {
    const { edges } = dtoToFlow(sampleDto);
    expect(edges).toEqual([{ id: "e1", source: "n1", target: "n2", label: undefined }]);
  });
});

describe("flowToPayload", () => {
  it("round-trips a dtoToFlow result back into an equivalent create payload", () => {
    const { nodes, edges } = dtoToFlow(sampleDto);
    const payload = flowToPayload({ name: sampleDto.name, isActive: sampleDto.isActive, nodes, edges });

    expect(payload.name).toBe("Sample");
    expect(payload.isActive).toBe(true);
    expect(payload.nodes).toEqual([
      { id: "n1", type: "TRIGGER", config: { trigger: "LEAD_CREATED" }, positionX: 10, positionY: 20 },
      {
        id: "n2",
        type: "ACTION_STATIC",
        config: { action: "CREATE_TASK", title: "Follow up", priority: "MEDIUM" },
        positionX: 300,
        positionY: 20,
      },
    ]);
    expect(payload.edges).toEqual([{ sourceNodeId: "n1", targetNodeId: "n2", label: undefined }]);
  });
});

describe("generateNodeId", () => {
  it("produces unique, prefixed ids", () => {
    const a = generateNodeId();
    const b = generateNodeId();
    expect(a).not.toBe(b);
    expect(a.startsWith("node_")).toBe(true);
  });
});
