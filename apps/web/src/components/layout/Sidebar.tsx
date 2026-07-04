"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users2 },
  { href: "/contacts", label: "Contacts", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-surface-border bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-surface-border px-5">
        <Sparkles className="h-5 w-5 text-brand-500" aria-hidden />
        <span className="text-sm font-semibold text-ink-900">
          FlowCRM <span className="text-brand-500">AI</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-600"
                  : "text-ink-500 hover:bg-surface-muted hover:text-ink-900"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
