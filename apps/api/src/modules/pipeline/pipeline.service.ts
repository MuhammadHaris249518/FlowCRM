import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { DEAL_STAGE_ORDER, pipelineRepository } from "./pipeline.repository";
import type { DealDTO, PaginatedDTO, PipelineBoardDTO } from "./pipeline.types";
import type {
  CreateDealInput,
  DealQuery,
  UpdateDealInput,
  UpdateDealStageInput,
} from "./pipeline.validation";

function toDealDTO(deal: {
  id: string;
  title: string;
  value: unknown; // Prisma.Decimal
  stage: string;
  companyId: string | null;
  company?: { name: string } | null;
  contactId: string | null;
  contact?: { fullName: string } | null;
  assigneeId: string | null;
  assignee?: { fullName: string } | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): DealDTO {
  return {
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    stage: deal.stage as DealDTO["stage"],
    companyId: deal.companyId,
    companyName: deal.company?.name ?? null,
    contactId: deal.contactId,
    contactName: deal.contact?.fullName ?? null,
    assigneeId: deal.assigneeId,
    assigneeName: deal.assignee?.fullName ?? null,
    closedAt: deal.closedAt ? deal.closedAt.toISOString() : null,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

async function assertReferencesExist(
  auth: AuthContext,
  companyId?: string | null,
  contactId?: string | null
) {
  if (companyId) {
    const exists = await pipelineRepository.companyExists(auth, companyId);
    if (!exists) throw AppError.badRequest("companyId does not exist in your organization");
  }
  if (contactId) {
    const exists = await pipelineRepository.contactExists(auth, contactId);
    if (!exists) throw AppError.badRequest("contactId does not exist in your organization");
  }
}

export const pipelineService = {
  async list(auth: AuthContext, query: DealQuery): Promise<PaginatedDTO<DealDTO>> {
    const { items, total } = await pipelineRepository.list(auth, query);
    return { items: items.map(toDealDTO), page: query.page, pageSize: query.pageSize, total };
  },

  async board(auth: AuthContext): Promise<PipelineBoardDTO> {
    const deals = await pipelineRepository.board(auth);
    const dtos = deals.map(toDealDTO);

    const stages = DEAL_STAGE_ORDER.map((stage) => {
      const stageDeals = dtos.filter((d) => d.stage === stage);
      return {
        stage,
        dealCount: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
        deals: stageDeals,
      };
    });

    return { stages };
  },

  async getById(auth: AuthContext, id: string): Promise<DealDTO> {
    const deal = await pipelineRepository.getById(auth, id);
    if (!deal) throw AppError.notFound("Deal not found");
    return toDealDTO(deal);
  },

  async create(auth: AuthContext, input: CreateDealInput): Promise<DealDTO> {
    await assertReferencesExist(auth, input.companyId, input.contactId);
    const deal = await pipelineRepository.create(auth, input);
    return toDealDTO(deal);
  },

  async update(auth: AuthContext, id: string, input: UpdateDealInput): Promise<DealDTO> {
    const exists = await pipelineRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Deal not found");

    // Same reassignment rule as leads.service.update — a SALES_REP can edit
    // their own deals but can't hand them off to someone else.
    if (input.assigneeId && auth.role === "SALES_REP" && input.assigneeId !== auth.userId) {
      throw AppError.forbidden("Sales reps cannot reassign deals to other users");
    }

    await assertReferencesExist(auth, input.companyId ?? undefined, input.contactId ?? undefined);
    const deal = await pipelineRepository.update(auth, id, input);
    return toDealDTO(deal);
  },

  async updateStage(
    auth: AuthContext,
    id: string,
    input: UpdateDealStageInput
  ): Promise<DealDTO> {
    const existing = await pipelineRepository.getById(auth, id);
    if (!existing) throw AppError.notFound("Deal not found");

    const deal = await pipelineRepository.updateStage(auth, id, input.stage);
    await pipelineRepository.logStageChangeActivity(auth, deal.title, input.stage);
    return toDealDTO(deal);
  },

  async delete(auth: AuthContext, id: string): Promise<void> {
    const exists = await pipelineRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Deal not found");
    await pipelineRepository.delete(auth, id);
  },
};
