# Dashboard — Multi-tenant Platform

Scaffold inicial: Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + NextAuth,
con el modelo de datos multi-tenant y el sistema de feature flags ya implementados.

## Setup local

```bash
npm install
cp .env.example .env
# Completa DATABASE_URL apuntando a una base Postgres local o remota

npx prisma migrate dev --name init
psql "$DATABASE_URL" -f prisma/rls.sql

npm run dev
```

## Crear el primer tenant y usuario admin

Todavía no hay UI de registro (se agrega en fases posteriores). Para el setup inicial,
crealos directo en la base con Prisma Studio o SQL:

```bash
npx prisma studio
```

O por SQL, generando el hash de contraseña con Node:

```bash
node -e "console.log(require('bcryptjs').hashSync('tu-clave-segura', 10))"
```

```sql
INSERT INTO users (id, email, password_hash) VALUES
  (gen_random_uuid(), 'admin@example.com', '<hash-generado-arriba>');

INSERT INTO tenants (id, name, slug, plan, status) VALUES
  (gen_random_uuid(), 'Demo Tenant', 'demo', 'pro', 'activo');

-- Asocia el usuario como admin del tenant recien creado
INSERT INTO tenant_users (id, tenant_id, user_id, role)
SELECT gen_random_uuid(), t.id, u.id, 'admin'
FROM tenants t, users u
WHERE t.slug = 'demo' AND u.email = 'admin@example.com';
```

## Deploy en Dokploy

1. En el servicio de tipo **Application**, conecta el repo vía la pestaña **Github**
   (no "Git" genérico) y selecciona el repositorio.
2. **Build Path**: `apps/dashboard` si mantienes el monorepo, `/` si este repo
   contiene solo el dashboard.
3. **Build Type**: Dockerfile (ya incluido en este directorio) — más predecible
   que Nixpacks para un proyecto con Prisma.
4. Variables de entorno: copia el contenido de `.env.example` completado con
   valores reales en la sección **Environment** del servicio.
5. **Domain**: tu dominio, HTTPS activado.
6. Tras el primer deploy exitoso, corre las migraciones contra la base de
   producción (`npx prisma migrate deploy` desde una terminal con acceso a la
   `DATABASE_URL` de producción, o vía el botón "Open Terminal" del
   propio servicio en Dokploy) y aplica `prisma/rls.sql`.

## Criterio de aceptación

- Un tenant nuevo se crea insertando filas, sin tocar código.
- Un usuario de un tenant no puede ver ni modificar datos de otro tenant.
- Las políticas RLS están activas y verificadas.
- El panel admin puede activar/desactivar canales y el cambio queda en `audit_log`.
- El servicio responde correctamente en el dominio configurado.