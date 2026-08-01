export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
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

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface TaskQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  contactId?: string;
  dealId?: string;
  leadId?: string;
  completed?: "true" | "false";
}

export interface TaskCalendarQuery {
  from: string; // ISO date
  to: string; // ISO date
  assigneeId?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: string;
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
  leadId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  assigneeId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
}
