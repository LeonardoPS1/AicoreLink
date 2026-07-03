export type Role = "cliente" | "admin_clinica" | "dev_aicore";

export interface SessionLike {
  role?: Role;
  tenantId?: string;
}

/**
 * Lanza si el rol de la sesion no esta entre los permitidos.
 * Usar al inicio de cualquier route handler sensible, ademas de la
 * proteccion a nivel de middleware (defensa en profundidad, igual
 * criterio que con RLS a nivel de base de datos).
 */
export function requireRole(session: SessionLike | null, allowed: Role[]) {
  if (!session?.role || !allowed.includes(session.role)) {
    throw new Error("No autorizado para esta accion");
  }
}

export function requireTenant(session: SessionLike | null): string {
  if (!session?.tenantId) {
    throw new Error("Sesion sin tenant asociado");
  }
  return session.tenantId;
}
