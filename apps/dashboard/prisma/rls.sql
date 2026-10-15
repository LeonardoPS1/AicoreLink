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
-- Se corre como el superusuario de la base (reece.schmeler67):
--
--   CREATE ROLE aicorelink_admin LOGIN PASSWORD '<deploy secret>' BYPASSRLS;
--   GRANT aicorelink_app TO aicorelink_admin;  -- hereda los grants de la app y suma BYPASSRLS
--
-- Verificacion:
--
--   SELECT rolname, rolsuper, rolbypassrls FROM pg_roles
--    WHERE rolname IN ('aicorelink_app', 'aicorelink_admin');
--
-- Esperado: aicorelink_app (f, f) y aicorelink_admin (f, t).
--
-- La app lo usa via la env DATABASE_URL_ADMIN (lib/db-admin.ts). El resto de las
-- conexiones sigue usando DATABASE_URL.
-- ---------------------------------------------------------------------------