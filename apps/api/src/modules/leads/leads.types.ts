export interface LeadDTO {
  id: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
  source: string | null;
  notes: string | null;
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

// Deliberately minimal, separate from pipeline.types.DealDTO — the leads
// module shouldn't import from pipeline's types just to describe the
// summary it returns after a conversion. Small duplication, zero coupling.
export interface ConvertedDealSummaryDTO {
  id: string;
  title: string;
  value: number;
  stage: string;
}

export interface ConvertLeadResultDTO {
  lead: LeadDTO;
  deal: ConvertedDealSummaryDTO;
}
