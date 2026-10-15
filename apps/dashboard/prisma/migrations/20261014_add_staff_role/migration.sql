-- Rol interno de Aicore, global por usuario (dev_aicore | operador | soporte).
-- Nullable: los usuarios comunes sacan su rol de tenant_users.role.
-- Idempotente por si la columna ya existe en algun entorno.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff_role" TEXT;

CREATE INDEX IF NOT EXISTS "users_staff_role_idx" ON "users"("staff_role");
