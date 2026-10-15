import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ADMIN_URL = process.env.DATABASE_URL_ADMIN;

describe("asAdmin()", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_ADMIN_URL === undefined) delete process.env.DATABASE_URL_ADMIN;
    else process.env.DATABASE_URL_ADMIN = ORIGINAL_ADMIN_URL;
  });

  it("fails loudly when DATABASE_URL_ADMIN is not configured", async () => {
    delete process.env.DATABASE_URL_ADMIN;
    process.env.DATABASE_URL = "postgresql://app:pw@localhost:5432/db";
    const { adminDb } = await import("@/lib/db-admin");
    expect(() => adminDb()).toThrowError(/DATABASE_URL_ADMIN/);
  });

  it("never falls back to the RLS connection silently", async () => {
    delete process.env.DATABASE_URL_ADMIN;
    process.env.DATABASE_URL = "postgresql://app:pw@localhost:5432/db";
    const { adminDb } = await import("@/lib/db-admin");
    let message = "";
    try {
      adminDb();
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain("postgresql://app:pw@localhost:5432/db");
  });
});
