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