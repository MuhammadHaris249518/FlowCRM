import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

// Every API error response follows this shape so the frontend can
// handle errors generically instead of parsing ad-hoc strings.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // Unexpected errors: never leak internals to the client, but log server-side.
  console.error("[unhandled_error]", err);
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}

// Wraps async route handlers so thrown/rejected errors reach errorHandler
// instead of crashing the process (Express doesn't catch async errors by default).
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
