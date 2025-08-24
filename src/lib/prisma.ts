/**
 * Prisma client singleton for Next.js app router.
 * Prevents exhausting DB connections during hot-reload.
 */
import PrismaPkg from "@prisma/client";

// Extract constructor at runtime without importing Prisma types (avoids missing type errors on CI)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { PrismaClient: PrismaClientCtor } = PrismaPkg as any;

// Add query logging in development for visibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = global as unknown as { prisma?: any };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientCtor({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
