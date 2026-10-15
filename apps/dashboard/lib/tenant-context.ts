import { Prisma } from "@prisma/client";
import { db } from "./db";
import { escalateToAdminRole } from "./db-admin";

/**
 * TODA consulta que sirva al panel CLIENTE debe pasar por este helper.
 * Fija `app.current_tenant` a nivel de la sesion de Postgres dentro de una
 * transaccion, para que las politicas de Row Level Security (RLS) filtren
 * automaticamente las filas del tenant correcto -incluso si hay un bug en
 * el codigo de la aplicacion, RLS es la ultima linea de defensa.
 *
 * NUNCA reemplazar esto por un simple `WHERE tenantId = ...` manual como
 * unica proteccion. El WHERE explicito sigue siendo buena practica, pero
 * RLS es la que garantiza el aislamiento real.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error("withTenant() requiere un tenantId valido");
  }

  return db.$transaction(async (tx) => {
    // set_config con is_local=true limita el efecto a esta transaccion.
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_tenant', $1, true)`,
      tenantId
    );
    return fn(tx);
  });
}

/**
 * Uso reservado para el panel de AICORE (roles staff), que necesita ver datos
 * de todos los tenants.
 *
 * Escala la MISMA conexion de la app dentro de la transaccion: el rol principal
 * (`aicorelink_app`) no tiene BYPASSRLS a proposito, para que RLS siga siendo la
 * ultima linea de defensa del panel cliente, y la escalada a `aicorelink_admin`
 * (rol con BYPASSRLS del que la app es miembro, ver `prisma/rls.sql`) dura lo que
 * dura la transaccion. Al terminar, la conexion vuelve al pool como
 * `aicorelink_app` y RLS queda activo otra vez.
 *
 * No usa una segunda conexion a proposito: un deploy de Dokploy reescribe el
 * spec del service desde lo que Dokploy guarda, borraba el DSN admin y dejaba al
 * panel de Aicore sin conexion cross-tenant.
 *
 * Usar con criterio: nunca exponer este helper a una ruta o pagina que sirva al
 * panel cliente.
 */
export async function asAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await escalateToAdminRole(tx);
    return fn(tx);
  });
}
