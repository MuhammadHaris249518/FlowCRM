import { Navbar } from "@/components/marketing/Navbar";
import { BookOpen, HelpCircle, Newspaper } from "lucide-react";

const RESOURCES = [
  { icon: BookOpen, title: "Documentation", blurb: "Setup guides and API reference — coming as modules ship." },
  { icon: Newspaper, title: "Blog", blurb: "Product updates and CRM best practices." },
  { icon: HelpCircle, title: "Help Center", blurb: "Answers to common questions about your workspace." },
];

export default function ResourcesPage() {
  return (
    <main>
      <Navbar />
      <section className="container-page py-16">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Resources
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink-500">
          We're building these out alongside the product. Check back as each
          module ships.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {RESOURCES.map((resource) => (
            <div
              key={resource.title}
              className="rounded-2xl border border-surface-border bg-white p-6 shadow-card"
            >
              <resource.icon className="h-5 w-5 text-brand-500" aria-hidden />
              <h2 className="mt-3 text-sm font-semibold text-ink-900">{resource.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{resource.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
