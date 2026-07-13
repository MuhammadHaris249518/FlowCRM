export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";

export interface Lead {
  id: string;
  status: LeadStatus;
  source: string | null;
  score: number;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface LeadQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeadStatus;
  assigneeId?: string;
}

export interface CreateLeadInput {
  contactId?: string;
  contactFullName?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;
  status?: LeadStatus;
  score?: number;
  assigneeId?: string;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  source?: string;
  score?: number;
  assigneeId?: string;
}
