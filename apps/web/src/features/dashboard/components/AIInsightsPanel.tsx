"use client";

import { Sparkles } from "lucide-react";

export function AIInsightsPanel() {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-500" aria-hidden />
        <h2 className="text-sm font-semibold text-ink-900">AI Assistant</h2>
      </div>
      {/* TODO: wire to AI service /ai/daily-summary once the AI Workspace module lands */}
      <p className="text-sm leading-relaxed text-ink-600">
        Good morning! You have 12 leads to follow up and 3 deals stuck in
        Proposal for more than 5 days. Want me to draft follow-up emails?
      </p>
      <button className="mt-3 text-sm font-semibold text-brand-500 hover:text-brand-600">
        Ask AI Assistant →
      </button>
    </div>
  );
}
