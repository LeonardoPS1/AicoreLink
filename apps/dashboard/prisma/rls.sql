-- Ejecutar manualmente contra la base de datos DESPUÉS de correr
-- `npx prisma migrate dev` por primera vez. Prisma no gestiona RLS de forma nativa.
--
-- Uso: psql "$DATABASE_URL" -f prisma/rls.sql

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tenant_isolation ON tenant_channels;
DROP POLICY IF EXISTS tenant_isolation ON channel_credentials;
DROP POLICY IF EXISTS tenant_isolation ON tenant_usage;
DROP POLICY IF EXISTS tenant_isolation ON conversations;
DROP POLICY IF EXISTS tenant_isolation ON messages;

ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_channels
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_credentials
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_usage
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messages
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Nota: el rol de base de datos usado por el panel ADMIN debe tener BYPASSRLS
-- para poder listar todos los tenants. El rol usado por el panel CLIENTE nunca
-- debe tener BYPASSRLS. Ejemplo de creación de ambos roles:
--
-- CREATE ROLE app_user LOGIN PASSWORD 'cambia-esto';
-- CREATE ROLE app_admin LOGIN PASSWORD 'cambia-esto' BYPASSRLS;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user, app_admin;

-- ---------------------------------------------------------------------------
-- Rol real de produccion para el panel de Aicore (F1)
-- ---------------------------------------------------------------------------
-- Las lecturas cross-tenant del panel de Aicore necesitan un rol que evada RLS.
-- El rol de la app (aicorelink_app) NO debe tener BYPASSRLS: RLS sigue siendo la
-- ultima linea de defensa del panel cliente, y la app sigue leyendo por ahi.
--
-- El panel de Aicore NO abre una segunda conexion: escala el rol de la misma
-- conexion dentro de su transaccion (`escalateToAdminRole()` en lib/db-admin.ts,
-- que emite `SELECT set_config('role', $1, true)` -la forma parametrizada de
-- `SET LOCAL ROLE`-). Para que eso funcione, la app tiene que ser MIEMBRO del rol
-- admin; la membresia inversa no puede existir (Postgres rechaza el ciclo).
--
-- Se corre como el superusuario de la base (reece.schmeler67):
--
--   CREATE ROLE aicorelink_admin NOLOGIN BYPASSRLS;
--   GRANT USAGE ON SCHEMA public TO aicorelink_admin;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aicorelink_admin;
--   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aicorelink_admin;
--   GRANT aicorelink_admin TO aicorelink_app;   -- la app puede escalar
--
-- Si el rol admin ya existia heredando los grants de la app (membresia
-- `GRANT aicorelink_app TO aicorelink_admin`), primero hay que revocarla:
--
--   REVOKE aicorelink_app FROM aicorelink_admin;
--
-- Verificacion:
--
--   SELECT rolname, rolsuper, rolbypassrls FROM pg_roles
--    WHERE rolname IN ('aicorelink_app', 'aicorelink_admin');
--   SELECT member::regrole, roleid::regrole FROM pg_auth_members
--    WHERE member::regrole::text = 'aicorelink_app';
--
-- Esperado: aicorelink_app (f, f), aicorelink_admin (f, t) y una sola membresia
-- `aicorelink_app -> aicorelink_admin`.
--
-- La escalada es transaction-local (`is_local = true`): al COMMIT o ROLLBACK la
-- conexion vuelve a aicorelink_app y RLS queda activo otra vez, asi que una
-- conexion del pool nunca se reusa con BYPASSRLS.
-- ---------------------------------------------------------------------------