import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middleware/error-handler";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { clerkWebhookRouter } from "./modules/auth/webhooks/clerk.webhook";
import { crmRouter } from "./modules/crm/crm.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.WEB_APP_URL, credentials: true }));

  // Clerk webhook must be mounted BEFORE express.json() — it needs the raw
  // request body for svix signature verification (clerk.webhook.ts applies
  // express.raw() itself, but only works if the global JSON parser hasn't
  // already consumed the body first).
  app.use("/api/v1/webhooks/clerk", clerkWebhookRouter);

  app.use(express.json());

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const clerkEnabled =
    typeof clerkSecretKey === "string" &&
    clerkSecretKey.length > 20 &&
    clerkSecretKey.startsWith("sk_") &&
    !clerkSecretKey.includes("placeholder") &&
    !clerkSecretKey.includes("your_key_here");

  if (clerkEnabled) {
    // Populates req.auth via Clerk's own declaration merging on every request.
    // Must run before any route that calls getAuth(req) — i.e. before authRouter
    // and before requireAuth()/requireAuthenticatedClerkSession() are useful.
    app.use(clerkMiddleware());
  }

  // Global rate limit as a baseline defense; per-route limits (e.g. stricter
  // on /auth/login) should be layered on top when that module is built.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/crm", crmRouter);

  // Must be registered last — Express matches error middleware by arity (4 args).
  app.use(errorHandler);

  return app;
}