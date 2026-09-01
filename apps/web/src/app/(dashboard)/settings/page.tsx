"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Building2,
  Key,
  Shield,
  Bell,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Save,
  Globe,
  Mail,
  Zap,
  Bot,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"organization" | "integrations" | "notifications" | "team">("organization");
  const [copiedKey, setCopiedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [orgName, setOrgName] = useState("FlowCRM Workspace");
  const [domain, setDomain] = useState("flowcrm.io");
  const [inboundEmail, setInboundEmail] = useState("inbound@flowcrm.io");
  const [timezone, setTimezone] = useState("UTC");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText("https://api.flowcrm.io/api/v1/communication/webhooks/resend");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <>
      <Topbar title="Settings & Configuration" />

      <main className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-ink-900">Workspace Settings</h1>
          <p className="text-xs text-ink-500">
            Manage your organization profile, API keys, Resend webhook integrations, and team permissions.
          </p>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            Settings updated successfully!
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-border gap-2">
          {[
            { id: "organization", label: "Organization", icon: Building2 },
            { id: "integrations", label: "API & Integrations", icon: Key },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "team", label: "Team & Roles", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-ink-500 hover:border-surface-border hover:text-ink-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Organization Settings */}
        {activeTab === "organization" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-ink-900">Organization Profile</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Company Domain
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Default Inbound Email Address
                  </label>
                  <input
                    type="email"
                    value={inboundEmail}
                    onChange={(e) => setInboundEmail(e.target.value)}
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500 bg-white"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="PKT">PKT (Pakistan Standard Time)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition-all shadow-xs"
              >
                <Save className="h-4 w-4" />
                Save Organization Settings
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: API & Integrations */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            {/* Resend & Svix Webhook Section */}
            <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">Resend & Svix Webhooks</h3>
                    <p className="text-xs text-ink-500">
                      Inbound email processing with cryptographic signature verification.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Inbound Webhook Endpoint
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="https://api.flowcrm.io/api/v1/communication/webhooks/resend"
                      className="flex-1 rounded-xl border border-surface-border bg-surface-muted px-3 py-2 text-xs text-ink-700 font-mono"
                    />
                    <button
                      onClick={handleCopyWebhookUrl}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-surface-muted transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedKey ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-muted/50 p-3 text-xs text-ink-600 flex items-center justify-between border border-surface-border">
                  <span>Svix Webhook Secret (`RESEND_WEBHOOK_SECRET`)</span>
                  <span className="font-mono text-ink-900 font-semibold">whsec_****************</span>
                </div>
              </div>
            </div>

            {/* Groq AI Engine Section */}
            <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">Groq AI Scoring Engine</h3>
                    <p className="text-xs text-ink-500">
                      Powers real-time lead scoring and automated pipeline recommendations.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === "notifications" && (
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-ink-900">Notification Preferences</h2>

            <div className="space-y-3 divide-y divide-surface-border">
              {[
                { title: "Inbound Email Alerts", desc: "Receive instant notifications when new emails arrive in the Communication Hub." },
                { title: "High-Priority Lead Scoring", desc: "Notify sales reps when a lead receives an AI score above 80." },
                { title: "Stale Deal Reminders", desc: "Get daily digests for deals stuck in negotiation phase." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between pt-3">
                  <div>
                    <div className="text-xs font-semibold text-ink-900">{item.title}</div>
                    <div className="text-[11px] text-ink-500">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded-md border-surface-border text-brand-600 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Team & Roles */}
        {activeTab === "team" && (
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink-900">Team Members</h2>
              <button className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                + Invite Member
              </button>
            </div>

            <div className="divide-y divide-surface-border border border-surface-border rounded-xl">
              {[
                { name: "Muhammad Haris", email: "haris@flowcrm.io", role: "OWNER" },
                { name: "Sarah Jenkins", email: "sarah@acme-corp.com", role: "ADMIN" },
                { name: "Alex Rivera", email: "alex@startuphub.io", role: "REP" },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                      {member.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-ink-900">{member.name}</div>
                      <div className="text-[11px] text-ink-400">{member.email}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink-700 border border-surface-border">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
