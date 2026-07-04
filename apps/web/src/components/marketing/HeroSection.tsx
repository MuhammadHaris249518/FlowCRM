import { CheckCircle2, Sparkles } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

const TRUST_BADGES = [
  "14-Day Free Trial",
  "No Credit Card",
  "Setup in Minutes",
];

const TRUSTED_COMPANIES = [
  "DentalCare",
  "LawFirm",
  "PropertyPro",
  "HireHub",
  "EduPath",
];

export function HeroSection() {
  return (
    <section className="overflow-hidden bg-white pb-16 pt-14 sm:pt-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        {/* Left column — copy */}
        <div>
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI-Powered CRM &amp; Automation Platform
          </span>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl">
            Close More Deals.{" "}
            <span className="text-brand-500">Automate Everything.</span>{" "}
            Grow Faster.
          </h1>

          <p className="mt-5 max-w-lg text-base text-ink-500">
            FlowCRM AI helps businesses capture leads, automate follow-ups,
            manage deals, and close more deals with the power of AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600">
              Start Free Trial
            </button>
            <button className="rounded-lg border border-surface-border px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-surface-muted">
              Book a Demo
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST_BADGES.map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-xs text-ink-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                {badge}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-300">
              Trusted by growing businesses worldwide
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 opacity-70">
              {TRUSTED_COMPANIES.map((name) => (
                <span key={name} className="text-sm font-semibold text-ink-500">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — product preview */}
        <div className="relative">
          <div
            className="absolute -inset-10 -z-10 rounded-full bg-brand-100 opacity-40 blur-3xl"
            aria-hidden
          />
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
