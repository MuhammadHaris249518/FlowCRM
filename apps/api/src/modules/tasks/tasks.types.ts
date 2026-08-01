export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  leadId: string | null;
  leadContactName: string | null;
  createdAt: string;
  updatedAt: string;
}

// Deliberately duplicated rather than imported from leads.types/pipeline.types
// — same precedent as ConvertedDealSummaryDTO: small duplication beats
// cross-module coupling.
export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
