export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetail extends Company {
  contacts: Contact[];
}

export interface Contact {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyId: string | null;
  companyName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CompanyQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ContactQuery extends CompanyQuery {
  companyId?: string;
}

export interface CreateCompanyInput {
  name: string;
  domain?: string;
  industry?: string;
  website?: string;
}
export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export interface CreateContactInput {
  fullName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
  ownerId?: string;
}
export type UpdateContactInput = Partial<CreateContactInput>;
