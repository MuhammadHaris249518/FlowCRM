"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { authApi } from "../api/auth-api";

// Intentionally doesn't pass organizationId — /auth/me is how we discover
// which orgs the user belongs to in the first place.
export function useMe() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.getMe({ getToken, organizationId: null }),
    enabled: Boolean(isSignedIn),
    retry: false,
  });
}