import { Navbar } from "@/components/marketing/Navbar";

const INDUSTRIES = [
  { name: "Healthcare Clinics", blurb: "Manage patient inquiries, appointment booking, and follow-ups in one pipeline." },
  { name: "Hospitals", blurb: "Coordinate multi-department leads and referrals without losing track." },
  { name: "Law Firms", blurb: "Track case inquiries from first contact through retainer." },
  { name: "Marketing Agencies", blurb: "Manage client leads and campaign performance side by side." },
  { name: "Real Estate Agencies", blurb: "Never lose a buyer or seller lead between showings." },
  { name: "Recruitment Companies", blurb: "Pipeline candidates and client requisitions in one view." },
  { name: "Educational Consultants", blurb: "Track student inquiries from first contact to enrollment." },
  { name: "Car Rental Companies", blurb: "Manage booking inquiries and repeat customer follow-up." },
  { name: "Service-Based Businesses", blurb: "Quote, follow up, and close jobs without spreadsheets." },
  { name: "Startups & SMEs", blurb: "Get enterprise-grade CRM without enterprise overhead." },
];

export default function IndustriesPage() {
  return (
    <main>
      <Navbar />
      <section className="container-page py-16">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Built for businesses that manage customers and sales
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink-500">
          FlowCRM AI adapts to how your industry actually sells — here&apos;s who
          we&apos;re built for today.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <div
              key={industry.name}
              className="rounded-2xl border border-surface-border bg-white p-6 shadow-card"
            >
              <h2 className="text-sm font-semibold text-ink-900">{industry.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{industry.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
