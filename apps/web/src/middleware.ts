import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/leads(.*)",
  "/contacts(.*)",
  "/pipeline(.*)",
  "/tasks(.*)",
  "/calendar(.*)",
  "/automation(.*)",
  "/ai-assistant(.*)",
  "/reports(.*)",
  "/inbox(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth: any, req: any) => {
  if (isProtectedRoute(req)) {
    await auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};