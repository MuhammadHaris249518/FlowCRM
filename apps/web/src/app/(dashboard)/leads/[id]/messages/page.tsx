"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { ConversationThreadBox } from "@/features/communication/components/ConversationThreadBox";
import { useLead } from "@/features/leads/hooks/use-leads";

// No pagination in Phase 1 — a generous fixed limit instead. Revisit if a
// single lead's thread genuinely exceeds this in practice.
const FULL_THREAD_LIMIT = 100;

export default function LeadMessagesPage() {
  const params = useParams<{ id: string }>();
  const lead = useLead(params.id);

  return (
    <>
      <Topbar title="Messages" />
      <main className="space-y-4 p-6 sm:p-8">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Leads
        </Link>

        {lead.isPending && <div className="text-sm text-ink-500">Loading...</div>}
        {lead.isError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Couldn't load this lead.
          </div>
        )}

        {lead.data && (
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h1 className="mb-4 text-sm font-semibold text-ink-900">
              {lead.data.contactName ?? "Lead"} — full conversation
            </h1>
            <ConversationThreadBox
              leadId={params.id}
              limit={FULL_THREAD_LIMIT}
              showSeeMoreLink={false}
            />
          </div>
        )}
      </main>
    </>
  );
}
