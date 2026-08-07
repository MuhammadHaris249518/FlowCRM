import type { Edge, Node } from "reactflow";
import type {
  CreateWorkflowEdgeInput,
  CreateWorkflowInput,
  CreateWorkflowNodeInput,
  WorkflowDTO,
  WorkflowNodeType,
} from "../types";

export interface BuilderNodeData {
  nodeType: WorkflowNodeType;
  config: Record<string, unknown>;
}

export type BuilderNode = Node<BuilderNodeData>;
export type BuilderEdge = Edge;

/** Server DTO -> ReactFlow's node/edge shape, used when opening the builder for an existing workflow. */
export function dtoToFlow(dto: WorkflowDTO): { nodes: BuilderNode[]; edges: BuilderEdge[] } {
  const nodes: BuilderNode[] = dto.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: { nodeType: n.type, config: n.config },
  }));

  const edges: BuilderEdge[] = dto.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label ?? undefined,
  }));

  return { nodes, edges };
}

/** ReactFlow's node/edge shape -> the API's create/update payload. */
export function flowToPayload(params: {
  name: string;
  isActive: boolean;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}): CreateWorkflowInput {
  const nodes: CreateWorkflowNodeInput[] = params.nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType,
    config: n.data.config,
    positionX: n.position.x,
    positionY: n.position.y,
  }));

  const edges: CreateWorkflowEdgeInput[] = params.edges.map((e) => ({
    sourceNodeId: e.source,
    targetNodeId: e.target,
    label: typeof e.label === "string" ? e.label : undefined,
  }));

  return { name: params.name, isActive: params.isActive, nodes, edges };
}

/** Generates a fresh client-side id for a new node. Never collides with a server id
 *  because server ids are cuids (see schema.prisma @default(cuid())) and this is a UUID. */
export function generateNodeId(): string {
  return `node_${crypto.randomUUID()}`;
}
