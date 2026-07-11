"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMe } from "../hooks/use-me";
import { useActiveOrganization } from "../provider/ActiveOrganizationProvider";

// Gates every (dashboard) route: a signed-in Clerk user isn't enough on its
// own — every org-scoped API call (see requireAuth() in apps/api) also needs
// an X-Organization-Id, which only exists once the user has created or
// joined a workspace. This component is the single place that enforces
// "signed in AND has an active organization" before rendering dashboard UI,
// mirroring the same responsibility auth-api.ts / use-me.ts already split
// out on the data side.
export function RequireOrganization({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { activeOrganizationId, setActiveOrganizationId } = useActiveOrganization();
  const me = useMe();

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    if (!me.data) return; // still loading, or errored — handled in render below

    if (me.data.organizations.length === 0) {
      router.replace("/onboarding/create-organization");
      return;
    }

    // Active org from localStorage (via ActiveOrganizationProvider) might be
    // stale — e.g. the user was removed from that org, or it's their first
    // load and nothing's set yet. Fall back to the first org /auth/me returns.
    const stillValid = me.data.organizations.some((org) => org.id === activeOrganizationId);
    if (!activeOrganizationId || !stillValid) {
      setActiveOrganizationId(me.data.organizations[0].id);
    }
  }, [
    clerkLoaded,
    isSignedIn,
    me.data,
    activeOrganizationId,
    setActiveOrganizationId,
    router,
  ]);

  // --- Render states ---

  if (!clerkLoaded || me.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (me.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-card">
          <p className="text-sm font-medium text-ink-900">
            Couldn't load your account
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {me.error instanceof Error ? me.error.message : "Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  if (!me.data || me.data.organizations.length === 0) {
    return null;
  }

  if (!activeOrganizationId) {
    return null;
  }

  return <>{children}</>;
}