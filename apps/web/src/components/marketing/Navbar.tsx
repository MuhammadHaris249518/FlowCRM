"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Industries", href: "/industries" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
  { label: "Company", href: "/company" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-white/80 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" aria-hidden />
          <span className="text-base font-semibold text-ink-900">
            FlowCRM <span className="text-brand-500">AI</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-700 hover:text-ink-900 sm:block"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Start Free Trial
          </Link>
        </div>
      </nav>
    </header>
  );
}
