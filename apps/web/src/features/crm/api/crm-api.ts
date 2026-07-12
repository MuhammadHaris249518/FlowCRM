import { apiClient, type RequestContext } from "@/lib/api-client";
import type {
  Company,
  CompanyDetail,
  CompanyQuery,
  Contact,
  ContactQuery,
  CreateCompanyInput,
  CreateContactInput,
  Paginated,
  UpdateCompanyInput,
  UpdateContactInput,
} from "../types";

function toParams(query: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params[key] = String(value);
  });
  return params;
}

export const crmApi = {
  listCompanies: (ctx: RequestContext, query: CompanyQuery = {}) =>
    apiClient.get<Paginated<Company>>("/crm/companies", ctx, toParams(query)),

  getCompany: (ctx: RequestContext, id: string) => 
    apiClient.get<CompanyDetail>(`/crm/companies/${id}`, ctx),

  createCompany: (ctx: RequestContext, input: CreateCompanyInput) => 
    apiClient.post<Company>("/crm/companies", ctx, input),

  updateCompany: (ctx: RequestContext, id: string, input: UpdateCompanyInput) =>
    apiClient.patch<Company>(`/crm/companies/${id}`, ctx, input),

  deleteCompany: (ctx: RequestContext, id: string) => 
    apiClient.delete(`/crm/companies/${id}`, ctx),

  listContacts: (ctx: RequestContext, query: ContactQuery = {}) =>
    apiClient.get<Paginated<Contact>>("/crm/contacts", ctx, toParams(query)),

  getContact: (ctx: RequestContext, id: string) => 
    apiClient.get<Contact>(`/crm/contacts/${id}`, ctx),

  createContact: (ctx: RequestContext, input: CreateContactInput) => 
    apiClient.post<Contact>("/crm/contacts", ctx, input),

  updateContact: (ctx: RequestContext, id: string, input: UpdateContactInput) =>
    apiClient.patch<Contact>(`/crm/contacts/${id}`, ctx, input),

  deleteContact: (ctx: RequestContext, id: string) => 
    apiClient.delete(`/crm/contacts/${id}`, ctx),
};
