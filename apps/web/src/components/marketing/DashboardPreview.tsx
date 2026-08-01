import {
  LayoutDashboard,
  Users2,
  Building2,
  GitBranch,
  CheckSquare,
  CalendarDays,
  Zap,
  Sparkles,
  BarChart3,
  Inbox,
  Settings,
  Bell,
  Search,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users2, label: "Leads" },
  { icon: Building2, label: "Contacts" },
  { icon: GitBranch, label: "Pipeline" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Zap, label: "Automation" },
  { icon: Sparkles, label: "AI Assistant" },
  { icon: BarChart3, label: "Reports" },
  { icon: Inbox, label: "Inbox" },
  { icon: Settings, label: "Settings" },
];

const STATS = [
  { label: "Total Revenue", value: "$128,430", delta: "+8.2%", accent: "bg-emerald-400" },
  { label: "New Leads", value: "1,642", delta: "+6.5%", accent: "bg-blue-400" },
  { label: "Deals Won", value: "326", delta: "+1.7%", accent: "bg-amber-400" },
  { label: "Conversion Rate", value: "19.8%", delta: "+2.3%", accent: "bg-brand-400" },
];

const PIPELINE = [
  { stage: "New Lead", value: "$32,440", count: 3 },
  { stage: "Contacted", value: "$21,200", count: 2 },
  { stage: "Qualified", value: "$18,600", count: 2 },
  { stage: "Proposal", value: "$24,500", count: 2 },
  { stage: "Won", value: "$30,780", count: 2 },
];

const ACTIVITIES = [
  { text: "New lead received from Website Form", time: "2 mins ago", dot: "bg-blue-400" },
  { text: "Follow-up email sent to John Smith", time: "10 mins ago", dot: "bg-emerald-400" },
  { text: "Deal moved to Proposal stage", time: "45 mins ago", dot: "bg-brand-400" },
  { text: "Meeting scheduled with Alex Johnson", time: "1 hr ago", dot: "bg-amber-400" },
];

export function DashboardPreview() {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-surface-border bg-white shadow-panel">
      {/* Icon sidebar */}
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-surface-border bg-surface-muted py-4 sm:flex">
        <Sparkles className="mb-3 h-4 w-4 text-brand-500" aria-hidden />
        {SIDEBAR_ITEMS.map((item) => (
          <div
            key={item.label}
            title={item.label}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              item.active ? "bg-brand-100 text-brand-600" : "text-ink-300"
            }`}
          >
            <item.icon className="h-4 w-4" aria-hidden />
          </div>
        ))}
      </aside>

      {/* Main preview content */}
      <div className="flex-1 p-4 sm:p-5">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">Dashboard</p>
          <div className="hidden items-center gap-2 rounded-lg bg-surface-muted px-3 py-1.5 text-xs text-ink-500 sm:flex">
            <Search className="h-3.5 w-3.5" aria-hidden />
            Search anything...
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-ink-500" aria-hidden />
            <div className="h-6 w-6 rounded-full bg-brand-100" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-surface-border p-3">
              <p className="text-[11px] text-ink-500">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-ink-900 sm:text-base">
                {stat.value}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`h-1 w-6 rounded-full ${stat.accent}`} />
                <span className="text-[11px] font-medium text-emerald-600">{stat.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline strip */}
        <div className="mb-4 rounded-xl border border-surface-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-700">Sales Pipeline</p>
            <span className="text-[11px] font-medium text-brand-500">View Pipeline →</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PIPELINE.map((stage) => (
              <div key={stage.stage} className="rounded-lg bg-surface-muted p-2">
                <p className="truncate text-[10px] text-ink-500">{stage.stage}</p>
                <p className="text-[11px] font-semibold text-ink-900">{stage.value}</p>
                <div className="mt-1 -space-x-1">
                  {Array.from({ length: stage.count }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block h-4 w-4 rounded-full border border-white bg-brand-200"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI assistant + activity */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden />
              <p className="text-xs font-semibold text-ink-700">AI Assistant</p>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-500">
              Good morning, Haris! You have 12 leads to follow up and 3 deals
              stuck in Proposal.
            </p>
            <button className="mt-2 text-[11px] font-semibold text-brand-500">
              Ask AI Assistant →
            </button>
          </div>
          <div className="rounded-xl border border-surface-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-700">Recent Activities</p>
            </div>
            <ul className="space-y-1.5">
              {ACTIVITIES.map((activity) => (
                <li key={activity.text} className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${activity.dot}`} />
                  <span className="flex-1 text-[11px] text-ink-700">{activity.text}</span>
                  <span className="shrink-0 text-[10px] text-ink-300">{activity.time}</span>
                </li>
              ))}
            </ul>
            <button className="mt-2 text-[11px] font-semibold text-brand-500">
              View All Activities →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
