// apps/dashboard/__tests__/rbac.test.ts
import { describe, it, expect } from "vitest";
import { isStaffRole, requireStaff, requireRole, requireTenant, STAFF_ROLES } from "@/lib/rbac";

describe("rbac", () => {
  it("treats dev_aicore, operador and soporte as staff", () => {
    expect(STAFF_ROLES).toEqual(["dev_aicore", "operador", "soporte"]);
    expect(isStaffRole("dev_aicore")).toBe(true);
    expect(isStaffRole("soporte")).toBe(true);
    expect(isStaffRole("cliente")).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });

  it("rejects the legacy admin_clinica role", () => {
    expect(isStaffRole("admin_clinica")).toBe(false);
  });

  it("requireStaff returns the role for staff", () => {
    expect(requireStaff({ role: "operador" })).toBe("operador");
  });

  it("requireStaff throws for a client", () => {
    expect(() => requireStaff({ role: "cliente" })).toThrow("No autorizado");
  });

  it("requireRole only accepts the allowed set", () => {
    expect(() => requireRole({ role: "soporte" }, ["dev_aicore"])).toThrow("No autorizado");
    expect(() => requireRole({ role: "dev_aicore" }, ["dev_aicore"])).not.toThrow();
  });

  it("requireTenant throws when the session has no tenant", () => {
    expect(() => requireTenant({ role: "dev_aicore", tenantId: null })).toThrow("Sesion sin tenant");
    expect(requireTenant({ role: "cliente", tenantId: "t1" })).toBe("t1");
  });
});
