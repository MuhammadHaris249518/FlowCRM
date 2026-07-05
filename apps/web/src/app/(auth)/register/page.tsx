"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  organizationName: z.string().min(2, "Enter your company name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (_data: RegisterForm) => {
    // TODO: wire to Clerk's signUp.create() + POST /api/v1/organizations
    // once the Auth module is built. No request goes out yet.
    await new Promise((r) => setTimeout(r, 400));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-white p-8 shadow-card">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" aria-hidden />
          <span className="text-base font-semibold text-ink-900">
            FlowCRM <span className="text-brand-500">AI</span>
          </span>
        </Link>

        <h1 className="text-xl font-semibold text-ink-900">Start your free trial</h1>
        <p className="mt-1 text-sm text-ink-500">14 days free. No credit card required.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink-700">
              Full name
            </label>
            <input
              id="fullName"
              autoComplete="name"
              {...register("fullName")}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="organizationName" className="mb-1.5 block text-sm font-medium text-ink-700">
              Company name
            </label>
            <input
              id="organizationName"
              autoComplete="organization"
              {...register("organizationName")}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            {errors.organizationName && (
              <p className="mt-1 text-xs text-red-600">{errors.organizationName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
