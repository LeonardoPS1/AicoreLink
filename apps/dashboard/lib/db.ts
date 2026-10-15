import { PrismaClient } from "@prisma/client";
import { databaseUrl } from "./env";

const url = databaseUrl();

if (!url) {
  throw new Error("DATABASE_URL is not set");
}

// Evita crear multiples instancias de PrismaClient en desarrollo (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Explicit so Prisma never resolves `env("DATABASE_URL")` on its own: the
    // URL may have arrived through the prefixed fallback in lib/env.
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}