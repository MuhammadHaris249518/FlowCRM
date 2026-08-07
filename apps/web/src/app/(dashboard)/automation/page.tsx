import { Topbar } from "@/components/layout/Topbar";
import { WorkflowsTable } from "@/features/automation/components/WorkflowsTable";

export default function AutomationPage() {
  return (
    <>
      <Topbar title="Automation" />
      <main className="space-y-6 p-6 sm:p-8">
        <WorkflowsTable />
      </main>
    </>
  );
}
