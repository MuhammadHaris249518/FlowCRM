import { Navbar } from "@/components/marketing/Navbar";

export default function BookDemoPage() {
  return (
    <main>
      <Navbar />
      <section className="container-page flex flex-col items-center py-24 text-center">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
          Book a Demo
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Scheduling is coming soon
        </h1>
        <p className="mt-4 max-w-md text-base text-ink-500">
          We haven't wired up live scheduling yet. In the meantime, start a
          free trial and explore the product directly — no demo call required.
        </p>
        <a
          href="/register"
          className="mt-8 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          Start Free Trial Instead
        </a>
      </section>
    </main>
  );
}
