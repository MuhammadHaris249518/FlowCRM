// Jest can't run NodeNext/ESM-style output cleanly, so tests are compiled to
// CommonJS via a dedicated tsconfig override (tests/tsconfig.json) instead of
// touching src/tsconfig.json, which stays NodeNext for the real build.
//
// This is plain JS, not jest.config.ts, specifically so Jest never needs
// ts-node just to bootstrap reading its own config file — ts-jest (used
// below, in the `transform` section) is a separate, already-working piece
// that handles the actual .test.ts files themselves.
/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@clerk/express$": "<rootDir>/__mocks__/@clerk/express.ts",
  },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tests/tsconfig.json",
      },
    ],
  },
  // Integration tests hit a real Postgres database sequentially per file to
  // avoid two test files racing to create/cleanup organizations with
  // overlapping data at the same time.
  maxWorkers: 1,
  testTimeout: 20000,
  clearMocks: true,
};

module.exports = config;
