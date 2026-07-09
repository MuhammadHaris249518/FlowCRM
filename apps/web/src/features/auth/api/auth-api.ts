import { apiClient, type RequestContext } from "@/lib/api-client";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface MeResponse {
  user: { id: string; email: string; fullName: string; avatarUrl: string | null };
  organizations: OrganizationSummary[];
  activeOrganizationId: string | null;
}

export const authApi = {
  getMe: (ctx: RequestContext) => apiClient.get<MeResponse>("/auth/me", ctx),
  createOrganization: (ctx: RequestContext, input: { name: string; slug: string }) =>
    apiClient.post<OrganizationSummary>("/auth/organizations", ctx, input),
};