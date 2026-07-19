import { Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { crmRepository } from "./crm.repository";
import type {
  CompanyDTO,
  CompanyDetailDTO,
  ContactDTO,
  PaginatedDTO,
} from "./crm.types";
import type {
  CompanyQuery,
  ContactQuery,
  CreateCompanyInput,
  CreateContactInput,
  UpdateCompanyInput,
  UpdateContactInput,
} from "./crm.validation";

function toCompanyDTO(company: {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CompanyDTO {
  return {
    id: company.id,
    name: company.name,
    domain: company.domain,
    industry: company.industry,
    website: company.website,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}

function toContactDTO(contact: {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyId: string | null;
  company?: { name: string } | null;
  ownerId: string | null;
  owner?: { fullName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): ContactDTO {
  return {
    id: contact.id,
    fullName: contact.fullName,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    companyId: contact.companyId,
    companyName: contact.company?.name ?? null,
    ownerId: contact.ownerId,
    ownerName: contact.owner?.fullName ?? null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

// Prisma unique-constraint violations surface as P2002. We translate that
// into the domain-level 409 rather than letting a raw Prisma error bubble
// to errorHandler's generic 500 path.
function rethrowAsConflict(err: unknown, message: string): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw AppError.conflict(message);
  }
  throw err;
}

export const crmService = {
  async listCompanies(
    auth: AuthContext,
    query: CompanyQuery
  ): Promise<PaginatedDTO<CompanyDTO>> {
    const { items, total } = await crmRepository.listCompanies(auth, query);
    return {
      items: items.map(toCompanyDTO),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },

  async getCompany(auth: AuthContext, id: string): Promise<CompanyDetailDTO> {
    const company = await crmRepository.getCompanyById(auth, id);
    if (!company) throw AppError.notFound("Company not found");
    return { ...toCompanyDTO(company), contacts: company.contacts.map(toContactDTO) };
  },

  async createCompany(auth: AuthContext, input: CreateCompanyInput): Promise<CompanyDTO> {
    const company = await crmRepository.createCompany(auth, input).catch((err) =>
      rethrowAsConflict(err, "A company with this name already exists")
    );
    return toCompanyDTO(company);
  },

  async updateCompany(
    auth: AuthContext,
    id: string,
    input: UpdateCompanyInput
  ): Promise<CompanyDTO> {
    const exists = await crmRepository.companyExists(auth, id);
    if (!exists) throw AppError.notFound("Company not found");
    const company = await crmRepository.updateCompany(auth, id, input);
    return toCompanyDTO(company);
  },

  async deleteCompany(auth: AuthContext, id: string): Promise<void> {
    const exists = await crmRepository.companyExists(auth, id);
    if (!exists) throw AppError.notFound("Company not found");
    await crmRepository.deleteCompany(auth, id);
  },

  async listContacts(
    auth: AuthContext,
    query: ContactQuery
  ): Promise<PaginatedDTO<ContactDTO>> {
    const { items, total } = await crmRepository.listContacts(auth, query);
    return {
      items: items.map(toContactDTO),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },

  async getContact(auth: AuthContext, id: string): Promise<ContactDTO> {
    const contact = await crmRepository.getContactById(auth, id);
    if (!contact) throw AppError.notFound("Contact not found");
    return toContactDTO(contact);
  },

  async createContact(auth: AuthContext, input: CreateContactInput): Promise<ContactDTO> {
    if (input.companyId) {
      const companyExists = await crmRepository.companyExists(auth, input.companyId);
      if (!companyExists) throw AppError.badRequest("companyId does not exist in your organization");
    }
    // Reps get auto-assigned as owner of contacts they create unless an
    // explicit ownerId was given (e.g. a manager assigning to a rep).
    const data =
      auth.role === "SALES_REP" && !input.ownerId
        ? { ...input, ownerId: auth.userId }
        : input;

    const contact = await crmRepository.createContact(auth, data).catch((err) =>
      rethrowAsConflict(err, "A contact with this email already exists in your organization")
    );
    return toContactDTO(contact);
  },

  async updateContact(
    auth: AuthContext,
    id: string,
    input: UpdateContactInput
  ): Promise<ContactDTO> {
    const existing = await crmRepository.getContactById(auth, id);
    if (!existing) throw AppError.notFound("Contact not found");

    if (input.ownerId && auth.role === "SALES_REP" && input.ownerId !== auth.userId) {
      throw AppError.forbidden("Sales reps cannot reassign contacts to other users");
    }

    if (input.companyId) {
      const companyExists = await crmRepository.companyExists(auth, input.companyId);
      if (!companyExists) throw AppError.badRequest("companyId does not exist in your organization");
    }

    const contact = await crmRepository.updateContact(auth, id, input).catch((err) =>
      rethrowAsConflict(err, "A contact with this email already exists in your organization")
    );
    return toContactDTO(contact);
  },

  async deleteContact(auth: AuthContext, id: string): Promise<void> {
    const existing = await crmRepository.getContactById(auth, id);
    if (!existing) throw AppError.notFound("Contact not found");
    await crmRepository.deleteContact(auth, id);
  },
};
