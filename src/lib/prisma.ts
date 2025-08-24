/**
 * Prisma client singleton for Next.js app router.
 * Prevents exhausting DB connections during hot-reload.
 */
import PrismaPkg from "@prisma/client";
type PrismaClient = import("@prisma/client").PrismaClient;

const { PrismaClient: PrismaClientCtor } = PrismaPkg as unknown as {
  PrismaClient: new (
    ...args: ConstructorParameters<PrismaClientConstructor>
  ) => PrismaClient;
};

// Helper type to describe the constructor signature without importing the class type directly
type PrismaClientConstructor = typeof import("@prisma/client").PrismaClient;

// Add query logging in development for visibility
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

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
