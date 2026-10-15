import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression guard for the 2026-10-15 production incident: a Dokploy deploy
 * rewrote the service spec from the values Dokploy holds (`AICORELINK_*`) and
 * dropped the unprefixed names the code reads, so the app booted without a
 * database URL and every auth route answered 500.
 *
 * These tests exercise the real consumer modules (lib/db, lib/db-admin,
 * lib/auth) with `@prisma/client` stubbed, so no database or network is touched.
 */

const captured = vi.hoisted(() => [] as Array<{ datasources?: { db?: { url?: string } } }>);

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor(config: { datasources?: { db?: { url?: string } } }) {
      captured.push(config);
    }
  },
}));

const KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_ADMIN",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AICORELINK_DATABASE_URL",
  "AICORELINK_DATABASE_URL_ADMIN",
  "AICORELINK_NEXTAUTH_SECRET",
  "AICORELINK_NEXTAUTH_URL",
] as const;

const original: Record<string, string | undefined> = {};
for (const key of KEYS) original[key] = process.env[key];

function clearEnv() {
  for (const key of KEYS) delete process.env[key];
  captured.length = 0;
  delete (globalThis as { prisma?: unknown }).prisma;
  delete (globalThis as { prismaAdmin?: unknown }).prismaAdmin;
  vi.resetModules();
}

describe("environment aliases in the consumer modules", () => {
  beforeEach(clearEnv);

  afterEach(() => {
    for (const key of KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("binds the main client to AICORELINK_DATABASE_URL when DATABASE_URL is missing", async () => {
    process.env.AICORELINK_DATABASE_URL = "postgresql://alias:pw@localhost:5432/db";

    const { db } = await import("@/lib/db");

    expect(db).toBeDefined();
    expect(captured.at(-1)?.datasources?.db?.url).toBe("postgresql://alias:pw@localhost:5432/db");
  });

  it("prefers DATABASE_URL over the prefixed name when both are set", async () => {
    process.env.DATABASE_URL = "postgresql://canonical:pw@localhost:5432/db";
    process.env.AICORELINK_DATABASE_URL = "postgresql://alias:pw@localhost:5432/db";

    await import("@/lib/db");

    expect(captured.at(-1)?.datasources?.db?.url).toBe("postgresql://canonical:pw@localhost:5432/db");
  });

  it("still refuses to boot when neither name is configured", async () => {
    await expect(import("@/lib/db")).rejects.toThrowError(/DATABASE_URL is not set/);
  });

  it("lets adminDb() read the prefixed name when DATABASE_URL_ADMIN is missing", async () => {
    process.env.DATABASE_URL = "postgresql://canonical:pw@localhost:5432/db";
    process.env.AICORELINK_DATABASE_URL_ADMIN = "postgresql://admin:pw@localhost:5432/db";

    const { adminDb } = await import("@/lib/db-admin");

    expect(() => adminDb()).not.toThrow();
    expect(captured.at(-1)?.datasources?.db?.url).toBe("postgresql://admin:pw@localhost:5432/db");
  });

  it("keeps failing loudly when neither admin name is configured", async () => {
    process.env.DATABASE_URL = "postgresql://canonical:pw@localhost:5432/db";

    const { adminDb } = await import("@/lib/db-admin");

    expect(() => adminDb()).toThrowError(/DATABASE_URL_ADMIN/);
  });

  it("falls back to AICORELINK_NEXTAUTH_SECRET for the session secret", async () => {
    process.env.DATABASE_URL = "postgresql://canonical:pw@localhost:5432/db";
    process.env.AICORELINK_NEXTAUTH_SECRET = "alias-secret";

    const { authOptions } = await import("@/lib/auth");

    expect(authOptions.secret).toBe("alias-secret");
  });

  it("prefers NEXTAUTH_SECRET over the prefixed name when both are set", async () => {
    process.env.DATABASE_URL = "postgresql://canonical:pw@localhost:5432/db";
    process.env.NEXTAUTH_SECRET = "canonical-secret";
    process.env.AICORELINK_NEXTAUTH_SECRET = "alias-secret";

    const { authOptions } = await import("@/lib/auth");

    expect(authOptions.secret).toBe("canonical-secret");
  });
});
