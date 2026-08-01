import { Topbar } from "@/components/layout/Topbar";
import { ContactsTable } from "@/features/crm/components/ContactsTable";

export default function ContactsPage() {
  return (
    <>
      <Topbar title="Contacts" />
      <main className="space-y-6 p-6 sm:p-8">
        <ContactsTable />
      </main>
    </>
  );
}
