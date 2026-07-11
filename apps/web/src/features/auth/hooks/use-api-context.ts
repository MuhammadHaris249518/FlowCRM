"use client";

import { useAuth } from "@clerk/nextjs";
import { useActiveOrganization } from "../provider/ActiveOrganizationProvider";
import type { RequestContext } from "@/lib/api-client";

export function useApiContext(): RequestContext {
  const { getToken } = useAuth();
  const { activeOrganizationId } = useActiveOrganization();
  return { getToken, organizationId: activeOrganizationId };
}