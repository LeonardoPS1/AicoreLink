---
name: postgresql
description: >-
  Guía de operaciones PostgreSQL: consultas, migraciones con Prisma, Row Level Security (RLS),
  administración de bases de datos multi-tenant, y troubleshooting.
---

## Uso

Incluye `@postgresql` al inicio de cualquier prompt relacionado con PostgreSQL.

## Modelo multi-tenant

- Una sola base de datos compartida
- Cada tabla operativa tiene columna `tenant_id`
- RLS activado para aislar tenants por fila
- El rol admin tiene `BYPASSRLS` para el panel admin

## RLS SQL

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_channels
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
-- Repetir para cada tabla con tenant_id
```

## Migraciones Prisma

```bash
# Desarrollo: crear nueva migración
cd apps/dashboard && npx prisma migrate dev --name descripcion

# Producción: aplicar migraciones pendientes
npx prisma migrate deploy

# Aplicar RLS después de migrar
psql "$DATABASE_URL" -f apps/dashboard/prisma/rls.sql
```

## Consultas útiles

```sql
-- Crear tenant de prueba
INSERT INTO tenants (id, name, slug) VALUES (gen_random_uuid(), 'Test Tenant', 'test');

-- Ver todos los tenants con sus usuarios
SELECT t.name, t.slug, u.email, tu.role
FROM tenants t
JOIN tenant_users tu ON tu.tenant_id = t.id
JOIN users u ON u.id = tu.user_id;

-- Verificar RLS: conectarse como rol de aplicación (NO admin) y ejecutar:
SELECT current_setting('app.current_tenant', true);
-- Debe devolver vacío. Luego:
SET LOCAL app.current_tenant = '<uuid>';
SELECT * FROM tenant_channels;
-- Solo debe devolver filas del tenant seteado.
```

## Troubleshooting

- **`relation "public.xxx" does not exist`**: Prisma usa `@@map()` con nombres snake_case, verificar el nombre real en la BD con `\dt`
- **RLS no funciona**: verificar que el usuario de BD no tenga `BYPASSRLS`, y que la política esté creada
- **Error de conexión**: verificar que `DATABASE_URL` tenga el formato correcto y el host sea accesible