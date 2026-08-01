import type { NextFunction, Request, Response } from "express";

let mockClerkUserId: string | null = null;

/**
 * Test-only control lever. Call this before making a request to control
 * what `getAuth(req).userId` returns inside requireAuth() / requireAuthenticatedClerkSession().
 * Pass null to simulate an unauthenticated request.
 */
export function __setMockClerkUserId(clerkId: string | null) {
  mockClerkUserId = clerkId;
}

export function getAuth(_req: Request) {
  return { userId: mockClerkUserId };
}

// app.ts only calls this when CLERK_SECRET_KEY looks valid; real
// clerkMiddleware() would populate request state Clerk-side. Tests don't
// need that — getAuth() above is already directly mocked — so this is a
// harmless passthrough.
export function clerkMiddleware() {
  return (_req: Request, _res: Response, next: NextFunction) => next();
}
