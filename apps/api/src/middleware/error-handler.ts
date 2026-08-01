import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
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

  // Zod validation errors (thrown by .parse() in *.validation.ts files)
  // become a proper 400 with per-field detail, instead of falling through
  // to the generic 500 path below.
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        fields: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
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
