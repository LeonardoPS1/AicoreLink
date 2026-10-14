export type Role = "cliente" | "dev_aicore" | "operador" | "soporte";

export const STAFF_ROLES: Role[] = ["dev_aicore", "operador", "soporte"];

/** Roles internos de Aicore: ven mas de un tenant y entran a /dashboard/admin. */
export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}

export interface SessionLike {
  role?: string | null;
  tenantId?: string | null;
  isStaff?: boolean;
}

/**
 * Lanza si el rol de la sesion no esta entre los permitidos. Usar al inicio de
 * cualquier route handler sensible, ademas de la proteccion a nivel de layout
 * (defensa en profundidad, igual criterio que con RLS a nivel de base de datos).
 */
export function requireRole(session: SessionLike | null, allowed: Role[]): void {
  if (!session?.role || !(allowed as string[]).includes(session.role)) {
    throw new Error("No autorizado para esta accion");
  }
}

/**
 * Lanza si la sesion no pertenece a un rol interno de Aicore, y devuelve el rol
 * para que el llamador pueda distinguir `soporte` (solo lectura) del resto.
 */
export function requireStaff(session: SessionLike | null): Role {
  if (!isStaffRole(session?.role)) throw new Error("No autorizado para esta accion");
  return session?.role as Role;
}

export function requireTenant(session: SessionLike | null): string {
  if (!session?.tenantId) throw new Error("Sesion sin tenant asociado");
  return session.tenantId;
}
