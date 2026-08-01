"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { RequireOrganization } from "@/features/auth/components/RequireOrganization";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireOrganization>
      <div className="flex min-h-screen bg-surface-muted">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </RequireOrganization>
  );
}