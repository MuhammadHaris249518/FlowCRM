import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { tasksRepository } from "./tasks.repository";
import type { PaginatedDTO, TaskDTO } from "./tasks.types";
import type { CreateTaskInput, TaskCalendarQuery, TaskQuery, UpdateTaskInput } from "./tasks.validation";

function toTaskDTO(task: {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueAt: Date | null;
  completedAt: Date | null;
  assigneeId: string | null;
  assignee?: { fullName: string } | null;
  contactId: string | null;
  contact?: { fullName: string } | null;
  dealId: string | null;
  deal?: { title: string } | null;
  leadId: string | null;
  lead?: { contact: { fullName: string } | null } | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority as TaskDTO["priority"],
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.fullName ?? null,
    contactId: task.contactId,
    contactName: task.contact?.fullName ?? null,
    dealId: task.dealId,
    dealTitle: task.deal?.title ?? null,
    leadId: task.leadId,
    leadContactName: task.lead?.contact?.fullName ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function assertLinksExist(auth: AuthContext, input: CreateTaskInput | UpdateTaskInput) {
  if (input.contactId) {
    const exists = await tasksRepository.contactExists(auth, input.contactId);
    if (!exists) throw AppError.badRequest("contactId does not exist in your organization");
  }
  if (input.dealId) {
    const exists = await tasksRepository.dealExists(auth, input.dealId);
    if (!exists) throw AppError.badRequest("dealId does not exist in your organization");
  }
  if (input.leadId) {
    const exists = await tasksRepository.leadExists(auth, input.leadId);
    if (!exists) throw AppError.badRequest("leadId does not exist in your organization");
  }
}

export const tasksService = {
  async list(auth: AuthContext, query: TaskQuery): Promise<PaginatedDTO<TaskDTO>> {
    const { items, total } = await tasksRepository.list(auth, query);
    return {
      items: items.map(toTaskDTO),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },

  async calendar(auth: AuthContext, query: TaskCalendarQuery): Promise<TaskDTO[]> {
    const items = await tasksRepository.calendar(auth, query);
    return items.map(toTaskDTO);
  },

  async getById(auth: AuthContext, id: string): Promise<TaskDTO> {
    const task = await tasksRepository.getById(auth, id);
    if (!task) throw AppError.notFound("Task not found");
    return toTaskDTO(task);
  },

  async create(auth: AuthContext, input: CreateTaskInput): Promise<TaskDTO> {
    await assertLinksExist(auth, input);
    const task = await tasksRepository.create(auth, input);
    return toTaskDTO(task);
  },

  async update(auth: AuthContext, id: string, input: UpdateTaskInput): Promise<TaskDTO> {
    const exists = await tasksRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Task not found");

    // Same rule as Leads: a SALES_REP may not hand their own task off to
    // someone else — only ORG_OWNER/SALES_MANAGER/SUPER_ADMIN can reassign.
    if (input.assigneeId && auth.role === "SALES_REP" && input.assigneeId !== auth.userId) {
      throw AppError.forbidden("Sales reps cannot reassign tasks to other users");
    }

    await assertLinksExist(auth, input);
    const task = await tasksRepository.update(auth, id, input);
    return toTaskDTO(task);
  },

  async delete(auth: AuthContext, id: string): Promise<void> {
    const exists = await tasksRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Task not found");
    await tasksRepository.delete(auth, id);
  },

  async complete(auth: AuthContext, id: string): Promise<TaskDTO> {
    const exists = await tasksRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Task not found");
    const task = await tasksRepository.complete(auth, id);
    return toTaskDTO(task);
  },

  async reopen(auth: AuthContext, id: string): Promise<TaskDTO> {
    const exists = await tasksRepository.exists(auth, id);
    if (!exists) throw AppError.notFound("Task not found");
    const task = await tasksRepository.reopen(auth, id);
    return toTaskDTO(task);
  },
};
