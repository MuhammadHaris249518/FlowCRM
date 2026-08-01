export type DealStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "MEETING"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface Deal {
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

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PipelineBoardStage {
  stage: DealStage;
  dealCount: number;
  totalValue: number;
  deals: Deal[];
}

export interface PipelineBoard {
  stages: PipelineBoardStage[];
}

export interface DealQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: DealStage;
  assigneeId?: string;
  companyId?: string;
  contactId?: string;
}

export interface CreateDealInput {
  title: string;
  value: number;
  stage?: DealStage;
  companyId?: string;
  contactId?: string;
  assigneeId?: string;
}
export type UpdateDealInput = Partial<Omit<CreateDealInput, "stage">>;
