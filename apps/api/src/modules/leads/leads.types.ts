export interface LeadDTO {
  id: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
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

export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
