import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { leadsRepository } from "./leads.repository";
import type { LeadDTO, PaginatedDTO, ConvertLeadResultDTO } from "./leads.types";
import type { CreateLeadInput, LeadQuery, UpdateLeadInput, ConvertLeadInput } from "./leads.validation";

function toLeadDTO(lead: {
  id: string;
  status: string;
  source: string | null;
  notes: string | null;
  score: number;
  contactId: string | null;
  contact?: { fullName: string; email: string | null } | null;
  assigneeId: string | null;
  assignee?: { fullName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): LeadDTO {
  return {
    id: lead.id,
    status: lead.status as LeadDTO["status"],
    source: lead.source,
    notes: lead.notes,
    score: lead.score,
    contactId: lead.contactId,
    contactName: lead.contact?.fullName ?? null,
    contactEmail: lead.contact?.email ?? null,
    assigneeId: lead.assigneeId,
    assigneeName: lead.assignee?.fullName ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export const leadsService = {
  async list(auth: AuthContext, query: LeadQuery): Promise<PaginatedDTO<LeadDTO>> {
    const { items, total } = await leadsRepository.list(auth, query);
    return {
      items: items.map(toLeadDTO),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },

  async getById(auth: AuthContext, id: string): Promise<LeadDTO> {
    const lead = await leadsRepository.getById(auth, id);
    if (!lead) throw AppError.notFound("Lead not found");
    return toLeadDTO(lead);
  },

  async create(auth: AuthContext, input: CreateLeadInput): Promise<LeadDTO> {
    if (input.contactId) {
      const exists = await leadsRepository.contactExists(auth, input.contactId);
      if (!exists) throw AppError.badRequest("contactId does not exist in your organization");
    }
    const lead = await leadsRepository.create(auth, input);
    return toLeadDTO(lead);
  },

  async update(auth: AuthContext, id: string, input: UpdateLeadInput): Promise<LeadDTO> {
    const exists = await leadsRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Lead not found");

    // Only ORG_OWNER/SALES_MANAGER/SUPER_ADMIN may reassign leads to someone
    // else; a SALES_REP may only act on their own leads (already enforced by
    // leadScopeFilter) and shouldn't be able to hand work off silently.
    if (input.assigneeId && auth.role === "SALES_REP" && input.assigneeId !== auth.userId) {
      throw AppError.forbidden("Sales reps cannot reassign leads to other users");
    }

    const lead = await leadsRepository.update(auth, id, input);
    return toLeadDTO(lead);
  },

  async delete(auth: AuthContext, id: string): Promise<void> {
    const exists = await leadsRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Lead not found");
    await leadsRepository.delete(auth, id);
  },

  async convert(
    auth: AuthContext,
    id: string,
    input: ConvertLeadInput
  ): Promise<ConvertLeadResultDTO> {
    const exists = await leadsRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Lead not found");

    const result = await leadsRepository.convertToDeal(auth, id, input.dealTitle, input.dealValue);
    if (!result) throw AppError.notFound("Lead not found");

    return {
      lead: toLeadDTO(result.lead),
      deal: {
        id: result.deal.id,
        title: result.deal.title,
        value: Number(result.deal.value),
        stage: result.deal.stage,
      },
    };
  },
};
