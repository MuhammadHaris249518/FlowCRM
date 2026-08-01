export interface CompanyDTO {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetailDTO extends CompanyDTO {
  contacts: ContactDTO[];
}

export interface ContactDTO {
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

export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
