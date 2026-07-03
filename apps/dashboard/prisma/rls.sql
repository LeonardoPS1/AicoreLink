-- Ejecutar manualmente contra la base "aicorelink" DESPUES de correr
-- `npx prisma migrate dev` por primera vez. Prisma no gestiona RLS de forma nativa.
--
-- Uso: psql "$AICORELINK_DATABASE_URL" -f prisma/rls.sql

ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_channels
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_credentials
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_usage
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Nota: el rol de base de datos usado por el panel ADMIN debe tener BYPASSRLS
-- para poder listar todos los tenants. El rol usado por el panel CLIENTE nunca
-- debe tener BYPASSRLS. Ejemplo de creación de ambos roles:
--
-- CREATE ROLE aicorelink_app LOGIN PASSWORD 'cambia-esto';
-- CREATE ROLE aicorelink_admin LOGIN PASSWORD 'cambia-esto' BYPASSRLS;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
