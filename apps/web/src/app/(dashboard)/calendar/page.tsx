import { Topbar } from "@/components/layout/Topbar";
import { CalendarView } from "@/features/tasks/components/CalendarView";

export default function CalendarPage() {
  return (
    <>
      <Topbar title="Calendar" />
      <main className="space-y-6 p-6 sm:p-8">
        <CalendarView />
      </main>
    </>
  );
}
