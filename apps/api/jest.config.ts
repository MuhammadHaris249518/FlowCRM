import type { Config } from "jest";

// Jest can't run NodeNext/ESM-style output cleanly, so tests are compiled to
// CommonJS via a dedicated tsconfig override (tests/tsconfig.json) instead of
// touching src/tsconfig.json, which stays NodeNext for the real build.
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@clerk/express$": "<rootDir>/__mocks__/@clerk/express.ts"
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

export default config;
