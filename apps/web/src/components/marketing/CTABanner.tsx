import Link from "next/link";
import { Clock, CreditCard, HeadphonesIcon, ShieldCheck } from "lucide-react";

const PERKS = [
  { icon: Clock, title: "Easy Setup", subtitle: "Get started in minutes" },
  { icon: CreditCard, title: "No Credit Card", subtitle: "14-day free trial" },
  { icon: HeadphonesIcon, title: "Dedicated Support", subtitle: "We're here to help" },
  { icon: ShieldCheck, title: "Secure & Reliable", subtitle: "Enterprise-grade security" },
];

export function CTABanner() {
  return (
    <section className="py-16">
      <div className="container-page">
        <div className="grid gap-10 rounded-3xl bg-brand-500 p-10 sm:p-14 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-3 max-w-md text-brand-100">
              Join thousands of businesses that trust FlowCRM AI to grow faster
              and work smarter.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition-opacity hover:opacity-90"
              >
                Start Free Trial
              </Link>
              <Link
                href="/book-demo"
                className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Book a Demo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {PERKS.map((perk) => (
              <div key={perk.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <perk.icon className="h-4.5 w-4.5 text-white" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{perk.title}</p>
                  <p className="text-xs text-brand-100">{perk.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
