import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "../models";
import { AppError } from "../errors/app-error";
import { User, Membership } from "../models";

// Named authContext (not `auth`) deliberately — @clerk/express's own
// clerkMiddleware() populates req.auth with its AuthObject type, which would
// otherwise collide with our custom shape via declaration merging.
export interface AuthContext {
  userId: string;
  clerkId: string;
  organizationId: string;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    authContext?: AuthContext;
  }
}

/**
 * Verifies a valid Clerk session exists, but does NOT require organization
 * membership. Use for endpoints that must work before a user has joined/
 * created an org — GET /auth/me, POST /auth/organizations.
 */
export function requireAuthenticatedClerkSession() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { userId } = getAuth(req);
    if (!userId) return next(AppError.unauthorized());
    next();
  };
}

/**
 * Verifies a valid Clerk session AND resolves the caller's Membership for the
 * organization named in the `X-Organization-Id` header, populating
 * req.authContext. Every org-scoped route (dashboard, CRM, leads, pipeline...)
 * uses this.
 */
export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return next(AppError.unauthorized());

    const organizationId = req.header("x-organization-id");
    if (!organizationId) {
      return next(
        AppError.badRequest(
          "Missing X-Organization-Id header — select an active organization first",
          "ORGANIZATION_REQUIRED"
        )
      );
    }

    const user = await User.findOne({ clerkId }).exec();
    if (!user) {
      return next(
        AppError.unauthorized("User record not found. Please complete onboarding.")
      );
    }

    const membership = await Membership.findOne({
      userId: user._id.toString(),
      organizationId,
    }).exec();
    if (!membership) {
      return next(AppError.forbidden("You are not a member of this organization"));
    }

    req.authContext = {
      userId: user.id,
      clerkId,
      organizationId,
      role: membership.role,
    };
    next();
  };
}

export function requireRole(allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authContext) return next(AppError.unauthorized());
    if (!allowed.includes(req.authContext.role)) {
      return next(AppError.forbidden("Your role cannot access this resource"));
    }
    next();
  };
}