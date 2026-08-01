import { PrismaClient } from "@prisma/client";

// Avoids exhausting DB connections from hot-reload creating new clients
// in development (a very common Prisma + ts-node-dev footgun).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
