import { redirect } from "next/navigation";

// Clerk's <SignIn> component surfaces "Forgot password?" and the full reset
// flow itself — there's no separate reset UI to build. This route exists only
// so any link to /forgot-password still resolves somewhere sensible.
export default function ForgotPasswordPage() {
  redirect("/login");
}