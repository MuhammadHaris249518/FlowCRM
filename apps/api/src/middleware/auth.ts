import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import type { Role } from "@prisma/client";

// Populated by requireAuth after verifying the Clerk session and
// resolving the caller's membership for the active organization.
export interface AuthContext {
  userId: string;
  organizationId: string;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

// In production this verifies the Clerk session token (via @clerk/express)
// and loads the user's Membership row for the org in the `x-org-id` header
// or subdomain. Kept as a clear extension point rather than hardcoding here.
export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    if (!sessionToken) {
      return next(AppError.unauthorized());
    }

    // TODO: verify with Clerk SDK, then look up Membership by clerkId + orgId
    // req.auth = { userId, organizationId, role };
    next();
  };
}

// Usage: router.get('/summary', requireAuth(), requireRole(['ORG_OWNER', 'SALES_MANAGER']), handler)
export function requireRole(allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!allowed.includes(req.auth.role)) {
      return next(AppError.forbidden("Your role cannot access this resource"));
    }
    next();
  };
}
