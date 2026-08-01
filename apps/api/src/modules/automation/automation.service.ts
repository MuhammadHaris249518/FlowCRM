import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { automationRepository } from "./automation.repository";
import type { CreateWorkflowInput, UpdateWorkflowInput, PaginationQuery } from "./automation.validation";

export const automationService = {
  async list(auth: AuthContext, query: PaginationQuery) {
    const { items, total } = await automationRepository.list(auth, query);
    return { items, page: query.page, pageSize: query.pageSize, total };
  },

  async getById(auth: AuthContext, id: string) {
    const workflow = await automationRepository.getById(auth, id);
    if (!workflow) throw AppError.notFound("Workflow not found");
    return workflow;
  },

  async create(auth: AuthContext, input: CreateWorkflowInput) {
    return automationRepository.create(auth, input);
  },

  async update(auth: AuthContext, id: string, input: UpdateWorkflowInput) {
    const exists = await automationRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Workflow not found");
    return automationRepository.update(auth, id, input);
  },

  async delete(auth: AuthContext, id: string) {
    const exists = await automationRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Workflow not found");
    await automationRepository.delete(auth, id);
  },
};
