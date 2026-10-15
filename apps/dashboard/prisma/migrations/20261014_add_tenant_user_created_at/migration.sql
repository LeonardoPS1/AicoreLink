-- Fecha de alta del vinculo usuario-tenant.
-- Hace falta para elegir el tenant activo por defecto de forma determinista
-- (el mas antiguo): sin una columna de orden, el orden que devuelve Postgres
-- queda librado al plan de ejecucion.
-- Las filas existentes quedan todas con el timestamp de la migracion; el
-- desempate final lo da el indice por id en las consultas que lo necesiten.

ALTER TABLE "tenant_users"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
