"use client";

import { Send } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft — not sent",
  QUEUED: "Sending...",
  SENT: "Sent",
  DELIVERED: "Delivered",
  FAILED: "Failed to send",
  RECEIVED: "Received",
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  QUEUED: "bg-blue-50 text-blue-700",
  SENT: "bg-emerald-50 text-emerald-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  RECEIVED: "bg-surface-muted text-ink-500",
};

export function MessageBubble({
  id,
  direction,
  status,
  subject,
  body,
  createdAt,
  isSending,
  onSend,
}: {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  subject: string | null;
  body: string;
  createdAt: string;
  isSending: boolean;
  onSend: (id: string) => void;
}) {
  const isOutbound = direction === "OUTBOUND";

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl p-3 text-sm ${
          isOutbound ? "bg-brand-50 text-ink-900" : "bg-surface-muted text-ink-900"
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[status] ?? ""}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
          <span className="text-[10px] text-ink-300">
            {new Date(createdAt).toLocaleString()}
          </span>
        </div>
        {subject && <p className="mb-1 text-xs font-semibold text-ink-700">{subject}</p>}
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>

        {status === "DRAFT" && (
          <button
            onClick={() => onSend(id)}
            disabled={isSending}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Send className="h-3 w-3" aria-hidden />
            {isSending ? "Sending..." : "Send"}
          </button>
        )}
      </div>
    </div>
  );
}
