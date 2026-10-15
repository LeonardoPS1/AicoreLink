import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression guard for the second F1 follow-up: the staff panel must escalate
 * the role of the connection it already has, never open a second one.
 *
 * The first implementation bound `asAdmin()` to a second PrismaClient reading
 * `DATABASE_URL_ADMIN`. A Dokploy deploy rewrote the service spec from the
 * values Dokploy stores and dropped that hand-added variable, so the staff
 * screens silently lost their cross-tenant connection. Now the escalation is a
 * `set_config('role', ..., true)` inside the same transaction.
 *
 * The `@prisma/client` stub throws on construction: if any code path behind
 * `asAdmin()` tries to open its own client again, these tests fail loudly.
 */

const state = vi.hoisted(() => ({
  calls: [] as Array<{ sql: string; args: unknown[] } | "callback">,
  transactions: 0,
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("asAdmin() must not open its own PrismaClient");
    }
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      state.transactions += 1;
      const tx = {
        $executeRawUnsafe: async (sql: string, ...args: unknown[]) => {
          state.calls.push({ sql, args });
          return 0;
        },
      };
      return fn(tx);
    },
  },
}));

const ESCALATION = {
  sql: expect.stringMatching(/set_config\(\s*'role'\s*,\s*\$1\s*,\s*true\s*\)/),
  args: ["aicorelink_admin"],
};

const SCOPE = {
  sql: expect.stringMatching(/set_config\(\s*'app\.current_tenant'\s*,\s*\$1\s*,\s*true\s*\)/),
  args: ["tenant-1"],
};

describe("asAdmin()", () => {
  beforeEach(() => {
    state.calls.length = 0;
    state.transactions = 0;
  });

  it("escalates the current connection inside the transaction", async () => {
    const { asAdmin } = await import("@/lib/tenant-context");

    const result = await asAdmin(async () => "cross-tenant");

    expect(result).toBe("cross-tenant");
    expect(state.transactions).toBe(1);
    expect(state.calls).toEqual([ESCALATION]);
  });

  it("escalates BEFORE the callback runs its first query", async () => {
    const { asAdmin } = await import("@/lib/tenant-context");

    await asAdmin(async () => {
      state.calls.push("callback");
      return null;
    });

    expect(state.calls[1]).toBe("callback");
  });

  it("never opens a second connection", async () => {
    const { asAdmin } = await import("@/lib/tenant-context");

    // The @prisma/client stub throws on construction, so this resolving at all
    // proves no extra client was instantiated on the way.
    await expect(asAdmin(async () => "ok")).resolves.toBe("ok");
  });

  it("propagates the callback failure", async () => {
    const { asAdmin } = await import("@/lib/tenant-context");

    await expect(
      asAdmin(async () => {
        throw new Error("boom");
      })
    ).rejects.toThrowError("boom");
    expect(state.calls).toEqual([ESCALATION]);
  });
});

describe("withTenant()", () => {
  beforeEach(() => {
    state.calls.length = 0;
    state.transactions = 0;
  });

  it("scopes the transaction to the tenant and never escalates the role", async () => {
    const { withTenant } = await import("@/lib/tenant-context");

    const result = await withTenant("tenant-1", async () => "scoped");

    expect(result).toBe("scoped");
    expect(state.transactions).toBe(1);
    expect(state.calls).toEqual([SCOPE]);
    expect(state.calls.some((call) => call !== "callback" && /'role'/.test(call.sql))).toBe(false);
  });

  it("rejects an empty tenantId before touching the database", async () => {
    const { withTenant } = await import("@/lib/tenant-context");

    await expect(withTenant("", async () => "x")).rejects.toThrowError(/tenantId/);
    expect(state.transactions).toBe(0);
  });
});
