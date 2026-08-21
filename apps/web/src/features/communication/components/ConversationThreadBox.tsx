"use client";

import Link from "next/link";
import { useState } from "react";
import { useMessageThread, useSendDraft } from "../hooks/use-communication";
import { MessageBubble } from "./MessageBubble";

export function ConversationThreadBox({
  leadId,
  limit = 5,
  showSeeMoreLink = true,
}: {
  leadId: string;
  limit?: number;
  showSeeMoreLink?: boolean;
}) {
  const thread = useMessageThread(leadId, limit);
  const sendDraft = useSendDraft();
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSend = async (messageId: string) => {
    setSendingId(messageId);
    setSendError(null);
    try {
      await sendDraft.mutateAsync(messageId);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send this email.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      {thread.isPending && (
        <div className="py-6 text-center text-sm text-ink-500">Loading messages...</div>
      )}
      {thread.isError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Couldn't load messages. Retry in a moment.
        </div>
      )}
      {thread.data && thread.data.length === 0 && (
        <div className="py-6 text-center text-sm text-ink-500">
          No messages yet with this lead.
        </div>
      )}

      {thread.data && thread.data.length > 0 && (
        <div className="space-y-3">
          {thread.data.map((message) => (
            <MessageBubble
              key={message.id}
              {...message}
              isSending={sendingId === message.id}
              onSend={handleSend}
            />
          ))}
        </div>
      )}

      {sendError && <p className="mt-2 text-xs text-red-600">{sendError}</p>}

      {showSeeMoreLink && thread.data && thread.data.length > 0 && (
        <Link
          href={`/leads/${leadId}/messages`}
          className="mt-3 inline-block text-xs font-semibold text-brand-500 hover:text-brand-600"
        >
          See all messages →
        </Link>
      )}
    </div>
  );
}
