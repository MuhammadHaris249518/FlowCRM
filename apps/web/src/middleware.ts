import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Only enable Clerk if a real-looking publishable key is set
const clerkEnabled =
  typeof publishableKey === "string" &&
  publishableKey.length > 20 &&
  publishableKey.startsWith("pk_") &&
  !publishableKey.includes("placeholder") &&
  !publishableKey.includes("your_key_here");

// Everything NOT listed here requires a signed-in Clerk session.
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/forgot-password",
  "/industries",
  "/pricing",
  "/resources",
  "/company",
  "/book-demo",
]);

export default clerkEnabled
  ? clerkMiddleware(async (auth: any, req: any) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : (async (_auth: any, _req: any) => {
      /* no-op when Clerk is disabled */
    });

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
