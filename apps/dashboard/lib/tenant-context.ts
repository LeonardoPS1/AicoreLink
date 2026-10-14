import { Prisma } from "@prisma/client";
import { db } from "./db";
import { adminDb } from "./db-admin";

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
 * Corre sobre una SEGUNDA conexion (`lib/db-admin.ts`, env `DATABASE_URL_ADMIN`)
 * cuyo rol tiene BYPASSRLS. El rol principal de la app NO tiene bypass a
 * proposito, para que RLS siga siendo la ultima linea de defensa del panel
 * cliente. Si `DATABASE_URL_ADMIN` no esta configurada, esto falla con un error
 * explicito: nunca cae en silencio a la conexion con RLS, porque esa conexion
 * devolveria cero filas sin avisar.
 *
 * Usar con criterio: nunca exponer este helper a una ruta o pagina que sirva al
 * panel cliente.
 */
export async function asAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return adminDb().$transaction(async (tx) => fn(tx));
}
