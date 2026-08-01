export interface OrganizationSummaryDTO {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface MeDTO {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  organizations: OrganizationSummaryDTO[];
  activeOrganizationId: string | null;
}