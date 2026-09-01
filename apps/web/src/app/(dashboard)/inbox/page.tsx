"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Inbox as InboxIcon,
  Mail,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { Message, MessageDirection, MessageStatus } from "@/features/communication/types";

// Mock initial Inbox items for rich demo & interactive fallback when API has no messages
const INITIAL_MESSAGES: (Message & { contactName: string })[] = [
  {
    id: "msg-1",
    channel: "EMAIL",
    direction: "INBOUND",
    status: "RECEIVED",
    subject: "Re: Product Demo & Enterprise Pricing Inquiry",
    body: "Hi team, thanks for the demo yesterday! We loved the workflow automation features. Could you send over a detailed enterprise proposal for 50 seats?",
    fromAddress: "sarah.jenkins@acme-corp.com",
    toAddress: "sales@flowcrm.io",
    sentAt: null,
    receivedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    contactName: "Sarah Jenkins (Acme Corp)",
  },
  {
    id: "msg-2",
    channel: "EMAIL",
    direction: "OUTBOUND",
    status: "DRAFT",
    subject: "Proposal: FlowCRM Enterprise Plan for 50 Seats",
    body: "Hi Sarah,\n\nFollowing up on your request, I've prepared our custom Enterprise tier proposal with priority AI scoring and Svix webhook security integration.\n\nLet me know when you'd like to review!",
    fromAddress: "sales@flowcrm.io",
    toAddress: "sarah.jenkins@acme-corp.com",
    sentAt: null,
    receivedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    contactName: "Sarah Jenkins (Acme Corp)",
  },
  {
    id: "msg-3",
    channel: "EMAIL",
    direction: "OUTBOUND",
    status: "SENT",
    subject: "Welcome to FlowCRM — Getting Started Guide",
    body: "Welcome aboard! Here are 3 quick steps to get your team onboarded with custom pipeline stages and lead scoring.",
    fromAddress: "onboarding@resend.dev",
    toAddress: "alex.tech@startuphub.io",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    receivedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    contactName: "Alex Rivera (StartupHub)",
  },
];

export default function InboxPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selectedId, setSelectedId] = useState<string>("msg-1");
  const [filterTab, setFilterTab] = useState<"ALL" | "INBOUND" | "OUTBOUND" | "DRAFT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const filteredMessages = messages.filter((msg) => {
    if (filterTab === "INBOUND" && msg.direction !== "INBOUND") return false;
    if (filterTab === "OUTBOUND" && (msg.direction !== "OUTBOUND" || msg.status === "DRAFT")) return false;
    if (filterTab === "DRAFT" && msg.status !== "DRAFT") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = msg.subject?.toLowerCase().includes(q);
      const matchBody = msg.body.toLowerCase().includes(q);
      const matchContact = msg.contactName.toLowerCase().includes(q);
      const matchEmail = (msg.fromAddress || msg.toAddress)?.toLowerCase().includes(q);
      return matchSubject || matchBody || matchContact || matchEmail;
    }
    return true;
  });

  const activeMessage = messages.find((m) => m.id === selectedId) || filteredMessages[0];

  const handleSendDraft = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "SENT" as MessageStatus,
              sentAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeBody.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      const newMsg: Message & { contactName: string } = {
        id: `msg-${Date.now()}`,
        channel: "EMAIL",
        direction: "OUTBOUND",
        status: "DRAFT",
        subject: composeSubject || "No Subject",
        body: composeBody,
        fromAddress: "sales@flowcrm.io",
        toAddress: composeTo,
        sentAt: null,
        receivedAt: null,
        createdAt: new Date().toISOString(),
        contactName: composeTo.split("@")[0] || composeTo,
      };

      setMessages((prev) => [newMsg, ...prev]);
      setSelectedId(newMsg.id);
      setIsComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setIsSending(false);
    }, 600);
  };

  return (
    <>
      <Topbar title="Communication Hub & Inbox" />

      <main className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
        {/* Top Header Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-600" />
              Email Communication Hub
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              Powered by Resend API & Svix Webhook Engine
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsComposing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Compose Email
            </button>
          </div>
        </div>

        {/* Main Inbox Layout: Sidebar List + Message Detail */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Filter Tabs + Search + Message List (5 Cols) */}
          <div className="flex h-[680px] flex-col rounded-2xl border border-surface-border bg-white shadow-sm lg:col-span-5">
            {/* Filter Tabs */}
            <div className="flex border-b border-surface-border p-2 gap-1 bg-surface-muted/30">
              {(["ALL", "INBOUND", "OUTBOUND", "DRAFT"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    filterTab === tab
                      ? "bg-white text-brand-700 shadow-2xs border border-surface-border"
                      : "text-ink-500 hover:text-ink-900 hover:bg-white/50"
                  }`}
                >
                  {tab === "ALL" && "All"}
                  {tab === "INBOUND" && "Received"}
                  {tab === "OUTBOUND" && "Sent"}
                  {tab === "DRAFT" && "Drafts"}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-surface-border">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails, contacts, or subjects..."
                  className="w-full rounded-xl border border-surface-border pl-9 pr-3 py-1.5 text-xs text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-400">
                  No messages found for this filter.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = activeMessage?.id === msg.id;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedId(msg.id)}
                      className={`w-full p-4 text-left transition-all ${
                        isSelected
                          ? "bg-brand-50/70 border-l-4 border-l-brand-600"
                          : "hover:bg-surface-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-900 truncate">
                          {msg.direction === "INBOUND" ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                          )}
                          <span className="truncate">{msg.contactName}</span>
                        </div>
                        <StatusBadge status={msg.status} />
                      </div>

                      <div className="mt-1 text-xs font-medium text-ink-800 truncate">
                        {msg.subject || "(No Subject)"}
                      </div>
                      <div className="mt-1 text-[11px] text-ink-500 line-clamp-2 leading-relaxed">
                        {msg.body}
                      </div>

                      <div className="mt-2 text-[10px] text-ink-400 flex items-center justify-between">
                        <span>{msg.direction === "INBOUND" ? msg.fromAddress : msg.toAddress}</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Message Detail View (7 Cols) */}
          <div className="flex h-[680px] flex-col rounded-2xl border border-surface-border bg-white shadow-sm lg:col-span-7">
            {activeMessage ? (
              <div className="flex flex-col h-full">
                {/* Message Header */}
                <div className="border-b border-surface-border p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-ink-900 leading-snug">
                        {activeMessage.subject || "No Subject"}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-semibold text-ink-700">
                          {activeMessage.contactName}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={activeMessage.status} size="lg" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-surface-muted/40 p-3 rounded-xl border border-surface-border">
                    <div>
                      <span className="text-ink-400">From:</span>{" "}
                      <span className="font-medium text-ink-800">
                        {activeMessage.fromAddress || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-400">To:</span>{" "}
                      <span className="font-medium text-ink-800">
                        {activeMessage.toAddress || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-400">Direction:</span>{" "}
                      <span className="font-medium text-ink-800">{activeMessage.direction}</span>
                    </div>
                    <div>
                      <span className="text-ink-400">Date:</span>{" "}
                      <span className="font-medium text-ink-800">
                        {new Date(activeMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed text-ink-900 whitespace-pre-wrap">
                  {activeMessage.body}
                </div>

                {/* Action Bar */}
                <div className="border-t border-surface-border p-4 bg-surface-muted/20 flex items-center justify-between">
                  {activeMessage.status === "DRAFT" ? (
                    <button
                      onClick={() => handleSendDraft(activeMessage.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Draft Email Now
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Message synced with Resend infrastructure
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                Select an email to view details
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {isComposing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-600" />
                  New Outbound Email Draft
                </h3>
                <button
                  onClick={() => setIsComposing(false)}
                  className="text-xs font-semibold text-ink-400 hover:text-ink-900"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDraft} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">To Email</label>
                  <input
                    type="email"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject line..."
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Message Body</label>
                  <textarea
                    rows={5}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your email content here..."
                    className="w-full rounded-xl border border-surface-border p-3 text-xs text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isSending ? "Saving Draft..." : "Save as Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function StatusBadge({ status, size = "sm" }: { status: MessageStatus; size?: "sm" | "lg" }) {
  const styles: Record<MessageStatus, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Draft" },
    QUEUED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Queued" },
    SENT: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Sent" },
    DELIVERED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Delivered" },
    FAILED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", label: "Failed" },
    RECEIVED: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", label: "Received" },
  };

  const current = styles[status] || styles.SENT;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${
        current.bg
      } ${current.text} ${size === "lg" ? "text-xs px-2.5 py-1" : "text-[10px]"}`}
    >
      {current.label}
    </span>
  );
}
