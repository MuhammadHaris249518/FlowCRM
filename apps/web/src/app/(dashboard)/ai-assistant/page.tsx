"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  Mail,
  Target,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { useAiInsights } from "@/features/dashboard/hooks/use-dashboard";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionItems?: string[];
}

const PROMPT_SUGGESTIONS = [
  {
    title: "Summarize Stale Leads",
    prompt: "Which leads haven't been contacted in over 7 days and need immediate follow-up?",
    icon: Target,
  },
  {
    title: "Draft Follow-Up Email",
    prompt: "Draft a friendly follow-up email for a high-priority enterprise lead.",
    icon: Mail,
  },
  {
    title: "Analyze Win-Loss Trends",
    prompt: "Give me an analysis of top reasons for lost deals this month.",
    icon: TrendingUp,
  },
  {
    title: "Automate Task Assignment",
    prompt: "Recommend automation rules for new inbound email leads.",
    icon: Zap,
  },
];

export default function AIAssistantPage() {
  const insights = useAiInsights();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! I am your FlowCRM AI Assistant. I can help you analyze leads, draft outbound emails, detect deal risks, and suggest automated workflows. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionItems: [
        "Review 3 stale leads requiring attention",
        "Generate automated task list for overdue deals",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = `Here is what I found regarding "${query}":`;
      let actionItems: string[] | undefined;

      if (query.toLowerCase().includes("stale") || query.toLowerCase().includes("contacted")) {
        aiResponseText =
          "Based on your CRM data, you have 3 leads with no recorded activity for over 7 days. I recommend sending a value-focused follow-up email or setting a phone call task.";
        actionItems = ["Draft email for Acme Corp", "Set reminder call for TechStart Inc"];
      } else if (query.toLowerCase().includes("email") || query.toLowerCase().includes("draft")) {
        aiResponseText =
          "Here is a drafted email for your lead:\n\nSubject: Following up on your software demo request\n\nHi there,\nI wanted to check in and see if you had any questions regarding our recent discussion. Let me know if you'd like to schedule a quick 10-minute call this week!\n\nBest regards,\nSales Team";
        actionItems = ["Send email draft", "Edit message template"];
      } else if (query.toLowerCase().includes("win") || query.toLowerCase().includes("loss") || query.toLowerCase().includes("trend")) {
        aiResponseText =
          "Analysis shows that 60% of lost deals this quarter were attributed to budget constraints, while 25% were lost to missing feature requirements. Re-engaging budget-sensitive leads with promotional tiering is recommended.";
      } else {
        aiResponseText = `I have processed your request for "${query}". Your sales pipeline is healthy, with 12 active deals valued at $45,000. All automated lead scoring rules are actively running.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionItems,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      <Topbar title="AI Assistant Workspace" />

      <main className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                AI Copilot Active
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                FlowCRM Intelligence Assistant
              </h1>
              <p className="mt-1 text-sm text-purple-100 max-w-2xl">
                Get real-time insights, generate AI sales emails, score incoming leads, and automate your sales workflow with natural language prompts.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => insights.refetch()}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all backdrop-blur-md"
              >
                <RefreshCw className={`h-4 w-4 ${insights.isFetching ? "animate-spin" : ""}`} />
                Sync CRM Data
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Chat Workspace + Insights Sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chat Container (2 Cols) */}
          <div className="flex h-[620px] flex-col rounded-2xl border border-surface-border bg-white shadow-sm lg:col-span-2">
            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                      msg.sender === "user"
                        ? "bg-brand-600 text-white rounded-br-none"
                        : "bg-surface-muted text-ink-900 rounded-bl-none border border-surface-border"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                    {msg.actionItems && (
                      <div className="mt-3 border-t border-surface-border/50 pt-2 space-y-1.5">
                        <span className="text-xs font-semibold text-brand-700 flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5" /> Recommended Actions:
                        </span>
                        {msg.actionItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-ink-700 bg-white/80 p-2 rounded-lg border border-surface-border">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`mt-1.5 text-[10px] ${
                        msg.sender === "user" ? "text-brand-200 text-right" : "text-ink-400"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-white">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Bot className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-surface-muted px-4 py-3 border border-surface-border">
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Suggestions Bar */}
            <div className="border-t border-surface-border bg-surface-muted/30 p-3 overflow-x-auto">
              <div className="flex gap-2">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all shadow-2xs"
                  >
                    <item.icon className="h-3.5 w-3.5 text-brand-500" />
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="border-t border-surface-border p-4 bg-white rounded-b-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask AI Assistant anything about your CRM, leads, or deals..."
                  className="flex-1 rounded-xl border border-surface-border px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* AI Insights & Quick Tools Panel (1 Col) */}
          <div className="space-y-6">
            {/* Live Insights Widget */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-500" />
                  Live AI Insights
                </h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Realtime
                </span>
              </div>

              {insights.data ? (
                <div className="space-y-3 text-xs">
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-amber-900">
                    <div className="font-semibold text-amber-800 flex items-center justify-between">
                      <span>Follow-up Leads</span>
                      <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[10px]">
                        {insights.data.followUpLeadsCount}
                      </span>
                    </div>
                    <p className="mt-1 text-amber-700">
                      {insights.data.followUpLeadsCount > 0
                        ? `${insights.data.followUpLeadsCount} leads have had no touchpoints recently.`
                        : "No stale leads detected."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-purple-50/70 border border-purple-200/60 p-3.5 text-purple-900">
                    <div className="font-semibold text-purple-800 flex items-center justify-between">
                      <span>Stuck Deals</span>
                      <span className="rounded-md bg-purple-200/80 px-1.5 py-0.5 text-[10px]">
                        {insights.data.stuckDealsCount}
                      </span>
                    </div>
                    <p className="mt-1 text-purple-700">
                      {insights.data.stuckDealsCount > 0
                        ? `${insights.data.stuckDealsCount} deals require action.`
                        : "No deals stuck in stage."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50/70 border border-rose-200/60 p-3.5 text-rose-900">
                    <div className="font-semibold text-rose-800 flex items-center justify-between">
                      <span>Overdue Tasks</span>
                      <span className="rounded-md bg-rose-200/80 px-1.5 py-0.5 text-[10px]">
                        {insights.data.overdueTasksCount}
                      </span>
                    </div>
                    <p className="mt-1 text-rose-700">
                      {insights.data.overdueTasksCount > 0
                        ? `${insights.data.overdueTasksCount} tasks past deadline.`
                        : "All tasks up to date!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-36 animate-pulse rounded-xl bg-surface-muted" />
              )}
            </div>

            {/* Quick AI Tool Shortcuts */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-base font-semibold text-ink-900">Quick AI Actions</h3>
              
              <button
                onClick={() => handleSend("Score all new leads using Groq AI scoring model")}
                className="w-full flex items-center justify-between rounded-xl border border-surface-border p-3 text-left hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink-900">Run AI Lead Scoring</div>
                    <div className="text-[11px] text-ink-500">Score new leads automatically</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleSend("Generate outbound email drafts for top leads")}
                className="w-full flex items-center justify-between rounded-xl border border-surface-border p-3 text-left hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink-900">Draft Outbound Emails</div>
                    <div className="text-[11px] text-ink-500">Generate personalized emails via Resend</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
