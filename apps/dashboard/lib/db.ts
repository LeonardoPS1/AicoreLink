import { PrismaClient } from "@prisma/client";

if (!process.env.AICORELINK_DATABASE_URL) {
  throw new Error("AICORELINK_DATABASE_URL is not set");
}

// Evita crear multiples instancias de PrismaClient en desarrollo (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
