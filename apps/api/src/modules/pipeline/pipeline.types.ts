export type DealStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "MEETING"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface DealDTO {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PipelineBoardDTO {
  stages: {
    stage: DealStage;
    dealCount: number;
    totalValue: number;
    deals: DealDTO[];
  }[];
}
