export interface WorkflowNodeDTO {
  id: string;
  type: "TRIGGER" | "CONDITION" | "DELAY" | "ACTION_STATIC" | "ACTION_AI";
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
}

export interface WorkflowEdgeDTO {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string | null;
}

export interface WorkflowDTO {
  id: string;
  name: string;
  isActive: boolean;
  nodes: WorkflowNodeDTO[];
  edges: WorkflowEdgeDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
