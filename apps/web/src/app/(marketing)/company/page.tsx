import { Navbar } from "@/components/marketing/Navbar";

export default function CompanyPage() {
  return (
    <main>
      <Navbar />
      <section className="container-page py-16">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Our mission
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
          Many businesses lose customers because their sales process is manual
          and disorganized — leads get forgotten, follow-ups get missed, and
          customer data ends up scattered across spreadsheets, email, and
          WhatsApp. FlowCRM AI exists to bring lead capture, sales pipeline,
          automation, and AI-assisted follow-up into one platform, so no lead
          is ever lost and every team can see exactly where revenue stands.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
          We're an early-stage build, in public, with the roadmap tracked
          openly module by module.
        </p>
      </section>
    </main>
  );
}
