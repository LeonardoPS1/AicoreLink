import { PrismaClient } from "@prisma/client";

/**
 * Second Prisma client for cross-tenant reads of the Aicore panel.
 *
 * It is bound to `DATABASE_URL_ADMIN`, the connection of a dedicated role with
 * `BYPASSRLS` (see `prisma/rls.sql`). The main app role (`aicorelink_app`) keeps
 * RLS enforced on purpose, so the client panel keeps Row Level Security as its
 * last line of defence and a bug in a client-facing query cannot leak another
 * tenant's rows.
 *
 * Lazy on purpose: the missing-env error must fire when a staff screen actually
 * reads, not while a client-facing module is being imported. This function
 * NEVER falls back to `DATABASE_URL`: reading through the RLS connection with a
 * staff role returns zero rows with no error, which is exactly the silent
 * failure this module exists to prevent.
 *
 * The URL and the password are never logged nor interpolated into the error.
 */

const globalForAdminPrisma = globalThis as unknown as { prismaAdmin?: PrismaClient };

let adminClient: PrismaClient | null = null;

export function adminDb(): PrismaClient {
  const url = process.env.DATABASE_URL_ADMIN;

  if (!url) {
    throw new Error(
      "DATABASE_URL_ADMIN no está configurada: las lecturas cross-tenant del panel de Aicore requieren un rol con BYPASSRLS (ver prisma/rls.sql)."
    );
  }

  if (adminClient) return adminClient;

  // Reuses the hot-reload singleton in development so `next dev` does not open
  // a new pool on every reload.
  const existing = globalForAdminPrisma.prismaAdmin;
  if (existing) {
    adminClient = existing;
    return adminClient;
  }

  adminClient = new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForAdminPrisma.prismaAdmin = adminClient;
  }

  return adminClient;
}
