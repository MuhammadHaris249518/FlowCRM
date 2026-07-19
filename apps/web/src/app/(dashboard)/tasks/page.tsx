import { Topbar } from "@/components/layout/Topbar";
import { TasksTable } from "@/features/tasks/components/TasksTable";

export default function TasksPage() {
  return (
    <>
      <Topbar title="Tasks" />
      <main className="space-y-6 p-6 sm:p-8">
        <TasksTable />
      </main>
    </>
  );
}
