import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type {
  CompanyQuery,
  ContactQuery,
  CreateCompanyInput,
  CreateContactInput,
  UpdateCompanyInput,
  UpdateContactInput,
} from "./crm.validation";

// Companies are visible org-wide regardless of role — unlike Contacts,
// they aren't assigned to a single rep. Contacts are rep-scoped for
// SALES_REP the same way dashboard.repository.scopeFilter scopes Leads/Deals.
function contactScopeFilter(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, ownerId: auth.userId };
  }
  return base;
}

export const crmRepository = {
  async listCompanies(auth: AuthContext, query: CompanyQuery) {
    const where: Prisma.CompanyWhereInput = {
      organizationId: auth.organizationId,
      ...(query.search
        ? { name: { contains: query.search, mode: "insensitive" } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.company.count({ where }),
    ]);

    return { items, total };
  },

  async getCompanyById(auth: AuthContext, id: string) {
    return prisma.company.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { contacts: { include: { owner: { select: { fullName: true } } } } },
    });
  },

  async createCompany(auth: AuthContext, input: CreateCompanyInput) {
    return prisma.company.create({
      data: { ...input, organizationId: auth.organizationId },
    });
  },

  async updateCompany(auth: AuthContext, id: string, input: UpdateCompanyInput) {
    // updateMany + findFirst-style existence check happens in the service layer,
    // which is why this only executes once the caller already confirmed ownership.
    return prisma.company.update({ where: { id }, data: input });
  },

  async deleteCompany(auth: AuthContext, id: string) {
    // Contacts keep their row (companyId -> null via onDelete: SetNull in schema).
    return prisma.company.delete({ where: { id } });
  },

  async companyExists(auth: AuthContext, id: string) {
    const company = await prisma.company.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(company);
  },

  async listContacts(auth: AuthContext, query: ContactQuery) {
    const where: Prisma.ContactWhereInput = {
      ...contactScopeFilter(auth),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          company: { select: { name: true } },
          owner: { select: { fullName: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return { items, total };
  },

  async getContactById(auth: AuthContext, id: string) {
    return prisma.contact.findFirst({
      where: { id, ...contactScopeFilter(auth) },
      include: {
        company: { select: { name: true } },
        owner: { select: { fullName: true } },
      },
    });
  },

  async createContact(auth: AuthContext, input: CreateContactInput) {
    return prisma.contact.create({
      data: { ...input, organizationId: auth.organizationId },
      include: {
        company: { select: { name: true } },
        owner: { select: { fullName: true } },
      },
    });
  },

  async updateContact(auth: AuthContext, id: string, input: UpdateContactInput) {
    return prisma.contact.update({
      where: { id },
      data: input,
      include: {
        company: { select: { name: true } },
        owner: { select: { fullName: true } },
      },
    });
  },

  async deleteContact(auth: AuthContext, id: string) {
    return prisma.contact.delete({ where: { id } });
  },
};
