import { Topbar } from "@/components/layout/Topbar";
import { CompaniesTable } from "@/features/crm/components/CompaniesTable";

export default function CompaniesPage() {
  return (
    <>
      <Topbar title="Companies" />
      <main className="space-y-6 p-6 sm:p-8">
        <CompaniesTable />
      </main>
    </>
  );
}
