# AicoreLink — Dashboard (Fase 0)

Scaffold inicial: Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + NextAuth,
con el modelo de datos multi-tenant y el sistema de feature flags de la Fase 0 ya
implementados.

## Setup local

```bash
npm install
cp .env.example .env
# Completa AICORELINK_DATABASE_URL apuntando a una base Postgres local o a la
# base "aicorelink" creada en tu VPS (recomendado usar un tunel SSH para probar
# contra la base real sin exponerla).

npx prisma migrate dev --name init
psql "$AICORELINK_DATABASE_URL" -f prisma/rls.sql

npm run dev
```

## Crear el primer tenant y usuario admin (dev_aicore)

Todavía no hay UI de registro (se agrega en fases posteriores). Para la Fase 0,
créalos directo en la base con Prisma Studio o SQL:

```bash
npx prisma studio
```

O por SQL, generando el hash de contraseña con Node:

```bash
node -e "console.log(require('bcryptjs').hashSync('tu-clave-segura', 10))"
```

```sql
INSERT INTO users (id, email, password_hash) VALUES
  (gen_random_uuid(), 'tu-email@aicorebots.com', '<hash-generado-arriba>');

INSERT INTO tenants (id, name, slug, plan, status) VALUES
  (gen_random_uuid(), 'Aicore Agency (admin)', 'aicore-admin', 'completo', 'activo');

-- Asocia el usuario como dev_aicore del tenant recien creado
INSERT INTO tenant_users (id, tenant_id, user_id, role)
SELECT gen_random_uuid(), t.id, u.id, 'dev_aicore'
FROM tenants t, users u
WHERE t.slug = 'aicore-admin' AND u.email = 'tu-email@aicorebots.com';
```

Para crear una clínica de prueba (rol `cliente`), repite el mismo patrón con
`role = 'cliente'` y un tenant nuevo.

## Deploy en Dokploy

1. En el servicio de tipo **Application**, conecta el repo vía la pestaña **Github**
   (no "Git" genérico) y selecciona `AicoreLink`.
2. **Build Path**: `apps/dashboard` si mantienes el monorepo, `/` si este repo
   contiene solo el dashboard.
3. **Build Type**: Dockerfile (ya incluido en este directorio) — más predecible
   que Nixpacks para un proyecto con Prisma.
4. Variables de entorno: copia el contenido de `.env.example` completado con
   valores reales en la sección **Environment** del servicio.
5. **Domain**: `AicoreLink.aicorebots.com`, HTTPS activado.
6. Tras el primer deploy exitoso, corre las migraciones contra la base de
   producción (`npx prisma migrate deploy` desde una terminal con acceso a la
   `AICORELINK_DATABASE_URL` de producción, o vía el botón "Open Terminal" del
   propio servicio en Dokploy) y aplica `prisma/rls.sql`.

## Criterio de aceptación de la Fase 0 (ver plan completo para el detalle)

- Un tenant nuevo se crea insertando filas, sin tocar código.
- Un usuario de un tenant no puede ver ni modificar datos de otro tenant.
- Las políticas RLS están activas y verificadas.
- El panel admin puede activar/desactivar canales y el cambio queda en `audit_log`.
- El servicio responde correctamente en `https://AicoreLink.aicorebots.com`.
