import path from "path";
import dotenv from "dotenv";
import { __setMockClerkUserId } from "../__mocks__/@clerk/express";

// Loads apps/api/.env — the same file `npm run dev` uses. Tests intentionally
// run against the real dev Postgres (Supabase) rather than a separate test
// database. Isolation comes from fixtures.ts: every test creates its own
// Organization with a unique slug and deletes it (cascades) when done, so
// tests never touch each other's data or your manually-created dev records.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Tests run against your real dev Postgres " +
      "(apps/api/.env) — copy .env.example to .env and fill in DATABASE_URL " +
      "before running `npm test`."
  );
}

// The Clerk mock stores the "logged in user" as a plain module variable,
// not a jest.fn(), so `clearMocks: true` in jest.config.js never resets it
// between tests. Without this, a test asserting "unauthenticated" behavior
// can silently inherit a previous test's __setMockClerkUserId(...) call and
// pass or fail for the wrong reason. Reset it before each test here so no
// test author needs to remember to do it themselves.
if (typeof beforeEach === "function") {
  beforeEach(() => {
    __setMockClerkUserId(null);
  });
}
