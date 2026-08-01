import { Navbar } from "@/components/marketing/Navbar";

export default function PricingPage() {
  return (
    <main>
      <Navbar />
      <section className="container-page flex flex-col items-center py-24 text-center">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
          Pricing
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Plans are being finalized
        </h1>
        <p className="mt-4 max-w-md text-base text-ink-500">
          We're still validating usage-based limits during the MVP build. Every
          plan will start with a 14-day free trial and no credit card required.
        </p>
        <button className="mt-8 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600">
          Join the waitlist
        </button>
      </section>
    </main>
  );
}
