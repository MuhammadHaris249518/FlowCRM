import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.WEB_APP_URL, credentials: true }));
  app.use(express.json());

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

  app.use("/api/v1/dashboard", dashboardRouter);

  // Must be registered last — Express matches error middleware by arity (4 args).
  app.use(errorHandler);

  return app;
}
