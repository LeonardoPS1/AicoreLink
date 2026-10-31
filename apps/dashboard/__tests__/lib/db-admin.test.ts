import { describe, expect, it, vi } from "vitest";

/**
 * The escalation helper of the staff panel (see `lib/db-admin.ts`).
 *
 * The role name is passed to Postgres as a bind parameter, so the query text
 * must never contain it; the identifier guard is the second layer that keeps a
 * dynamic name from ever reaching the database.
 */

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("lib/db-admin must not open a connection");
    }
  },
}));

function recordingTx() {
  const calls: Array<{ sql: string; args: unknown[] }> = [];
  return {
    calls,
    tx: {
      $executeRawUnsafe: async (sql: string, ...args: unknown[]) => {
        calls.push({ sql, args });
        return 0;
      },
    },
  };
}

const UNSAFE_ROLES = ["", "Admin", "1admin", "a-b", "a b", "admin; drop table users", "'admin'"];

describe("ADMIN_DB_ROLE", () => {
  it("is the BYPASSRLS role documented in prisma/rls.sql", async () => {
    const { ADMIN_DB_ROLE } = await import("@/lib/db-admin");

    expect(ADMIN_DB_ROLE).toBe("aicorelink_admin");
    expect(await import("@/lib/db-admin")).not.toHaveProperty("adminDb");
  });
});

describe("isSafeRoleName()", () => {
  it("accepts a plain lowercase identifier", async () => {
    const { isSafeRoleName } = await import("@/lib/db-admin");

    expect(isSafeRoleName("aicorelink_admin")).toBe(true);
  });

  it.each(UNSAFE_ROLES)("rejects %j", async (role) => {
    const { isSafeRoleName } = await import("@/lib/db-admin");

    expect(isSafeRoleName(role)).toBe(false);
  });

  it("rejects a name past the Postgres identifier limit", async () => {
    const { isSafeRoleName } = await import("@/lib/db-admin");

    // NAMEDATALEN - 1: Postgres truncates silently at 63, so fail before it.
    expect(isSafeRoleName("a".repeat(63))).toBe(true);
    expect(isSafeRoleName("a".repeat(64))).toBe(false);
  });
});

describe("escalateToAdminRole()", () => {
  it("passes the role as a bind parameter and never into the query text", async () => {
    const { escalateToAdminRole } = await import("@/lib/db-admin");
    const { calls, tx } = recordingTx();

    await escalateToAdminRole(tx as any);

    expect(calls).toHaveLength(1);
    expect(calls[0].args).toEqual(["aicorelink_admin"]);
    expect(calls[0].sql).toMatch(/set_config\(\s*'role'\s*,\s*\$1\s*,\s*true\s*\)/);
    expect(calls[0].sql).not.toContain("aicorelink_admin");
  });

  it("accepts an explicit role", async () => {
    const { escalateToAdminRole } = await import("@/lib/db-admin");
    const { calls, tx } = recordingTx();

    await escalateToAdminRole(tx as any, "other_role");

    expect(calls[0].args).toEqual(["other_role"]);
  });

  it.each(UNSAFE_ROLES)("refuses %j without touching the database", async (role) => {
    const { escalateToAdminRole } = await import("@/lib/db-admin");
    const { calls, tx } = recordingTx();

    await expect(escalateToAdminRole(tx as any, role)).rejects.toThrowError(/rol invalido/);
    expect(calls).toHaveLength(0);
  });
});
