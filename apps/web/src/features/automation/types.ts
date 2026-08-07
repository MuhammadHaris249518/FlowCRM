export type WorkflowNodeType = "TRIGGER" | "CONDITION" | "DELAY" | "ACTION_STATIC" | "ACTION_AI";

// Mirrors apps/api/.../automation.repository.ts OutboxEventType enum — the
// only events the outbox poller currently dispatches on.
export type TriggerEvent =
  | "LEAD_CREATED"
  | "LEAD_STATUS_CHANGED"
  | "DEAL_STAGE_CHANGED"
  | "TASK_OVERDUE"
  | "ACTIVITY_LOGGED";

export type ConditionOperator = "eq" | "neq" | "gte" | "lte";

export type StaticAction = "CREATE_TASK" | "UPDATE_LEAD_STATUS";

export interface TriggerConfig {
  trigger: TriggerEvent;
}

export interface ConditionConfig {
  field: string; // dotted path into run context, e.g. "entity.score"
  op: ConditionOperator;
  value: string | number | boolean;
}

export interface DelayConfig {
  hours: number;
}

export interface CreateTaskActionConfig {
  action: "CREATE_TASK";
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface UpdateLeadStatusActionConfig {
  action: "UPDATE_LEAD_STATUS";
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
}

export type ActionStaticConfig = CreateTaskActionConfig | UpdateLeadStatusActionConfig;

// ACTION_AI has no engine implementation yet (see automation.engine.ts —
// it always fails the run). The config shape is reserved so saved graphs
// don't need a migration once sprint 2 ships it.
export interface ActionAiConfig {
  instructions: string;
}

export type NodeConfig = TriggerConfig | ConditionConfig | DelayConfig | ActionStaticConfig | ActionAiConfig;

export interface WorkflowNodeDTO {
  id: string;
  type: WorkflowNodeType;
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

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface WorkflowQuery {
  page?: number;
  pageSize?: number;
}

// Client -> API payload shapes. `id` on a node here is always a client-
// generated temp id (crypto.randomUUID()), used only to wire edges — see
// automation.repository.ts create()/update() tempIdToRealId map.
export interface CreateWorkflowNodeInput {
  id: string;
  type: WorkflowNodeType;
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
}

export interface CreateWorkflowEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
}

export interface CreateWorkflowInput {
  name: string;
  isActive: boolean;
  nodes: CreateWorkflowNodeInput[];
  edges: CreateWorkflowEdgeInput[];
}

export type UpdateWorkflowInput = Partial<CreateWorkflowInput>;
