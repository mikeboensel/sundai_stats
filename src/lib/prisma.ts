/**
 * Prisma client singleton for Next.js app router.
 * Prevents exhausting DB connections during hot-reload.
 */
import { PrismaClient } from "@prisma/client";

// Add query logging in development for visibility
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
