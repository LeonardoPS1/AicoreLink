import { Prisma } from "@prisma/client";
import { db } from "./db";

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
 * Uso reservado para el panel ADMIN (rol dev_aicore), que necesita ver
 * datos de todos los tenants. Requiere que la conexion de base de datos
 * use un rol con BYPASSRLS (ver prisma/rls.sql). Usar con criterio: nunca
 * exponer este helper a una ruta que sirva al panel cliente.
 */
export async function asAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => fn(tx));
}
