"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (_data: LoginForm) => {
    // TODO: wire to Clerk's signIn.create() once the Auth module is built.
    // Intentionally not calling a fake API here — no request goes out yet.
    await new Promise((r) => setTimeout(r, 400));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-white p-8 shadow-card">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" aria-hidden />
          <span className="text-base font-semibold text-ink-900">
            FlowCRM <span className="text-brand-500">AI</span>
          </span>
        </Link>

        <h1 className="text-xl font-semibold text-ink-900">Log in to your account</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back — pick up where you left off.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
              Email
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
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-ink-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-brand-500 hover:text-brand-600">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
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
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand-500 hover:text-brand-600">
            Start free trial
          </Link>
        </p>
      </div>
    </main>
  );
}
