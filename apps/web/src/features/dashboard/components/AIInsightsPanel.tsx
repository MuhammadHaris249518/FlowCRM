"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { AIInsights } from "../types";

export function AIInsightsPanel({ insights }: { insights: AIInsights }) {
  const hasAnything =
    insights.followUpLeadsCount > 0 ||
    insights.stuckDealsCount > 0 ||
    insights.overdueTasksCount > 0;

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-500" aria-hidden />
        <h2 className="text-sm font-semibold text-ink-900">AI Assistant</h2>
      </div>

      <p className="text-sm leading-relaxed text-ink-600">{insights.summary}</p>

      {hasAnything && (
        <Link
          href="/leads"
          className="mt-3 inline-block text-sm font-semibold text-brand-500 hover:text-brand-600"
        >
          Review leads →
        </Link>
      )}
    </div>
  );
}
