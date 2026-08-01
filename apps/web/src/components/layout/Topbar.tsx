import { Bell, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-6">
      <h1 className="text-lg font-semibold text-ink-900">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-500 md:flex">
          <Search className="h-4 w-4" aria-hidden />
          <span>Search anything...</span>
        </div>
        <button aria-label="Notifications" className="text-ink-500 hover:text-ink-900">
          <Bell className="h-5 w-5" aria-hidden />
        </button>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </header>
  );
}