"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { authApi } from "@/features/auth/api/auth-api";
import { useMe } from "@/features/auth/hooks/use-me";
import { useActiveOrganization } from "@/features/auth/provider/ActiveOrganizationProvider";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { setActiveOrganizationId } = useActiveOrganization();
  const me = useMe();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If the user already has a workspace (e.g. they refreshed this page after
  // creating one), skip straight to the dashboard.
  useEffect(() => {
    if (me.data && me.data.organizations.length > 0) {
      setActiveOrganizationId(me.data.organizations[0].id);
      router.replace("/dashboard");
    }
  }, [me.data, router, setActiveOrganizationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const org = await authApi.createOrganization(
        { getToken, organizationId: null },
        { name, slug }
      );
      setActiveOrganizationId(org.id);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" aria-hidden />
          <span className="text-sm font-semibold text-ink-900">
            FlowCRM <span className="text-brand-500">AI</span>
          </span>
        </div>

        <h1 className="text-xl font-semibold text-ink-900">Create your workspace</h1>
        <p className="mt-1 text-sm text-ink-500">
          This is where your team's contacts, deals, and pipelines will live.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink-700">
              Workspace name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder="Acme Inc."
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-ink-700">
              Workspace URL
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-surface-border focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-400">
              <span className="pl-3 text-sm text-ink-300">flowcrm.ai/</span>
              <input
                id="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="acme-inc"
                className="w-full rounded-r-lg px-1 py-2 text-sm text-ink-900 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Creating workspace..." : "Create workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}