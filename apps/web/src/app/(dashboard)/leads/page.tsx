import { Topbar } from "@/components/layout/Topbar";
import { LeadsTable } from "@/features/leads/components/LeadsTable";

export default function LeadsPage() {
  return (
    <>
      <Topbar title="Leads" />
      <main className="space-y-6 p-6 sm:p-8">
        <LeadsTable />
      </main>
    </>
  );
}
