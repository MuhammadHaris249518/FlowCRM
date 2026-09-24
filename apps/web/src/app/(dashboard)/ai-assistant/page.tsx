"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Target,
  Mail,
  TrendingUp,
  Clock,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useAiInsights } from "@/features/dashboard/hooks/use-dashboard";
import { useAssistantChat } from "@/features/assistant/hooks/use-assistant";
import { ApiError } from "@/lib/api-client";
import type { AssistantAction, AssistantMessage } from "@/features/assistant/types";

const SUGGESTIONS = [
  {
    title: "Best target leads",
    prompt: "Who are my best target leads right now, and why?",
    icon: Target,
  },
  {
    title: "Needs follow-up",
    prompt: "Which leads need follow-up, and what should I do first?",
    icon: Clock,
  },
  {
    title: "Pipeline summary",
    prompt: "Summarize my sales pipeline this month, including stuck deals.",
    icon: GitBranch,
  },
  {
    title: "Win / loss",
    prompt: "Why are we winning and losing deals this month?",
    icon: TrendingUp,
  },
  {
    title: "Draft a follow-up",
    prompt:
      "Find my highest-scoring open lead and draft a short follow-up email for them. Do not send it.",
    icon: Mail,
  },
];

const WELCOME: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I can answer questions about your live CRM data — leads, pipeline, tasks, reports, and drafts. Ask anything like “who are my best target leads?” I’ll look it up; I won’t invent records. Emails I write stay as drafts for you to review.",
};

export default function AIAssistantPage() {
  const insights = useAiInsights();
  const chat = useAssistantChat();
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [actionsByMessage, setActionsByMessage] = useState<Record<string, AssistantAction[]>>({});
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || chat.isPending) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSendError(null);

    try {
      const history = next
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      const result = await chat.mutateAsync(history);
      const assistantMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (result.actions.length > 0) {
        setActionsByMessage((prev) => ({ ...prev, [assistantMsg.id]: result.actions }));
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the assistant. Try again in a moment.";
      setSendError(message);
    }
  };

  return (
    <>
      <Topbar title="AI Assistant" />

      <main className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex h-[680px] flex-col rounded-2xl border border-surface-border bg-white lg:col-span-2">
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  actions={actionsByMessage[msg.id]}
                />
              ))}

              {chat.isPending && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Bot className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-sm text-ink-500">Looking up your CRM data…</div>
                </div>
              )}
            </div>

            {sendError && (
              <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            <div className="border-t border-surface-border bg-surface-muted/30 p-3">
              <div className="flex gap-2 overflow-x-auto">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => send(item.prompt)}
                    disabled={chat.isPending}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                  >
                    <item.icon className="h-3.5 w-3.5 text-brand-500" />
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="flex items-center gap-2 border-t border-surface-border p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about leads, deals, tasks, reports…"
                disabled={chat.isPending}
                className="flex-1 rounded-xl border border-surface-border px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || chat.isPending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-surface-border bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Sparkles className="h-4 w-4 text-brand-500" />
                Workspace snapshot
              </h3>
              {insights.isPending && <div className="h-36 animate-pulse rounded-xl bg-surface-muted" />}
              {insights.isError && (
                <p className="text-sm text-red-700">Couldn't load insight counts.</p>
              )}
              {insights.data && (
                <div className="space-y-3 text-xs">
                  <InsightRow
                    label="Follow-up leads"
                    count={insights.data.followUpLeadsCount}
                    detail={
                      insights.data.followUpLeadsCount > 0
                        ? `${insights.data.followUpLeadsCount} leads with no recent touch.`
                        : "No stale leads."
                    }
                  />
                  <InsightRow
                    label="Stuck deals"
                    count={insights.data.stuckDealsCount}
                    detail={
                      insights.data.stuckDealsCount > 0
                        ? `${insights.data.stuckDealsCount} deals idle over 5 days.`
                        : "No deals stuck in stage."
                    }
                  />
                  <InsightRow
                    label="Overdue tasks"
                    count={insights.data.overdueTasksCount}
                    detail={
                      insights.data.overdueTasksCount > 0
                        ? `${insights.data.overdueTasksCount} tasks past deadline.`
                        : "All tasks up to date."
                    }
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-ink-500">
              Snapshot counts come from your CRM. Chat answers are generated from the same
              scoped data via the Node API — the assistant never sends email on its own.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

function ChatBubble({
  message,
  actions,
}: {
  message: AssistantMessage;
  actions?: AssistantAction[];
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "rounded-br-none bg-brand-600 text-white"
            : "rounded-bl-none border border-surface-border bg-surface-muted text-ink-900"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        {actions && actions.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-surface-border/60 pt-2">
            {actions.map((action, idx) => (
              <ActionLink key={`${action.type}-${idx}`} action={action} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-white">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

function ActionLink({ action }: { action: AssistantAction }) {
  if (action.type === "email_draft") {
    const href = action.leadId ? `/leads/${action.leadId}/messages` : "/tasks";
    return (
      <Link href={href} className="block text-xs font-semibold text-brand-600 hover:text-brand-700">
        Review draft: {action.subject} →
      </Link>
    );
  }
  return (
    <Link
      href="/leads"
      className="block text-xs font-semibold text-brand-600 hover:text-brand-700"
    >
      Scored {action.score}/100 — {action.reasoning} →
    </Link>
  );
}

function InsightRow({
  label,
  count,
  detail,
}: {
  label: string;
  count: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border p-3.5">
      <div className="flex items-center justify-between font-semibold text-ink-800">
        <span>{label}</span>
        <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px]">{count}</span>
      </div>
      <p className="mt-1 text-ink-600">{detail}</p>
    </div>
  );
}
