import type { Prisma } from "@prisma/client";

/**
 * Cross-tenant reads of the Aicore panel (staff screens only).
 *
 * The app role `aicorelink_app` has Row Level Security enforced on purpose: the
 * client panel keeps RLS as its last line of defence, so a bug in a client-facing
 * query cannot leak another tenant's rows. The staff panel still needs to see
 * every tenant, so it escalates the connection it ALREADY has, inside its own
 * transaction.
 *
 * `set_config('role', ..., true)` is the parameterised form of `SET LOCAL ROLE`,
 * so the name reaches Postgres as a bind value and never as SQL text. The role
 * is `aicorelink_admin`, a `BYPASSRLS` role that `aicorelink_app` is a member of
 * (see `prisma/rls.sql`). `is_local = true` makes the switch die with the
 * transaction: the connection goes back to the pool as `aicorelink_app`, with RLS
 * on again. Verified against production on the same backend pid (4 rows inside
 * the transaction, 0 rows after COMMIT).
 *
 * This replaced a second PrismaClient bound to `DATABASE_URL_ADMIN`: a Dokploy
 * deploy rewrites the service spec from the values Dokploy stores, dropped that
 * hand-added variable, and left the staff panel without an admin connection.
 * Nothing here reads an extra DSN, so a deploy can no longer break the panel.
 */

/** The `BYPASSRLS` role the staff panel escalates to. */
export const ADMIN_DB_ROLE = "aicorelink_admin";

const SAFE_ROLE_NAME = /^[a-z_][a-z0-9_]*$/;

/** Postgres silently truncates identifiers past NAMEDATALEN - 1. */
const ROLE_NAME_MAX_LENGTH = 63;

/** A role name is only ever a plain lowercase identifier. */
export function isSafeRoleName(role: string): boolean {
  return role.length <= ROLE_NAME_MAX_LENGTH && SAFE_ROLE_NAME.test(role);
}

/**
 * Switches the CURRENT transaction to the cross-tenant role.
 *
 * The change is transaction-local: it disappears on COMMIT and on ROLLBACK, so a
 * pooled connection is never returned still holding `BYPASSRLS`.
 */
export async function escalateToAdminRole(
  tx: Prisma.TransactionClient,
  role: string = ADMIN_DB_ROLE
): Promise<void> {
  if (!isSafeRoleName(role)) {
    throw new Error("escalateToAdminRole() recibio un nombre de rol invalido");
  }

  await tx.$executeRawUnsafe(`SELECT set_config('role', $1, true)`, role);
}
