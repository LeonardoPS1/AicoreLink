// apps/dashboard/__tests__/auth-authorize.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));

const compare = vi.fn();
vi.mock("bcryptjs", () => ({ default: { compare: (...a: unknown[]) => compare(...a) } }));

import { authorizeCredentials } from "@/lib/auth";

const authorize = authorizeCredentials;

async function run(user: unknown, passwordMatch: boolean) {
  findUnique.mockResolvedValue(user);
  compare.mockResolvedValue(passwordMatch);
  return authorize({ email: "a@b.cl", password: "x" });
}

describe("authorize", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lets Aicore staff in with no tenant link", async () => {
    const result = await run(
      { id: "u1", email: "leo@aicorebots.com", passwordHash: "h", staffRole: "dev_aicore", tenantLinks: [] },
      true,
    );
    expect(result).toMatchObject({ id: "u1", role: "dev_aicore", isStaff: true, tenantId: null });
  });

  it("lets a business owner in through their tenant link", async () => {
    const result = await run(
      {
        id: "u2",
        email: "duena@negocio.cl",
        passwordHash: "h",
        staffRole: null,
        tenantLinks: [{ tenantId: "t1", role: "cliente", tenant: { name: "Negocio" } }],
      },
      true,
    );
    expect(result).toMatchObject({ id: "u2", role: "cliente", isStaff: false, tenantId: "t1" });
  });

  it("rejects a non-staff user with no tenant link", async () => {
    const result = await run(
      { id: "u3", email: "x@y.cl", passwordHash: "h", staffRole: null, tenantLinks: [] },
      true,
    );
    expect(result).toBeNull();
  });

  it("rejects a wrong password even for staff", async () => {
    const result = await run(
      { id: "u1", email: "leo@aicorebots.com", passwordHash: "h", staffRole: "dev_aicore", tenantLinks: [] },
      false,
    );
    expect(result).toBeNull();
  });

  it("picks the oldest tenant link, not whatever the database returns first", async () => {
    const result = await run(
      {
        id: "u4",
        email: "dos@negocios.cl",
        passwordHash: "h",
        staffRole: null,
        tenantLinks: [
          { tenantId: "t1", role: "cliente", tenant: { name: "Primero" } },
          { tenantId: "t2", role: "cliente", tenant: { name: "Segundo" } },
        ],
      },
      true,
    );
    expect(result).toMatchObject({ tenantId: "t1" });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          tenantLinks: expect.objectContaining({ orderBy: { createdAt: "asc" } }),
        }),
      }),
    );
  });
});
