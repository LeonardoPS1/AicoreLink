---
name: backend
description: >-
  Guía de desarrollo backend para AicoreLink: API Routes de Next.js, Prisma ORM, NextAuth, RLS,
  multi-tenancy, y patrones de seguridad.
---

## Uso

Incluye `@backend` al inicio de cualquier prompt relacionado con el backend del dashboard.

## Stack backend

- Next.js 14 Route Handlers (`app/api/.../route.ts`)
- Prisma ORM para acceso a PostgreSQL
- NextAuth v4 con Credentials Provider + JWT
- RLS (Row Level Security) para aislamiento multi-tenant

## Patrón de RLS con Prisma

Toda query del panel cliente debe ejecutarse dentro de `withTenant()`:

```ts
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    return fn(tx);
  });
}
```

## NextAuth configuration

- Provider: Credentials (email + contraseña)
- JWT embedding: `tenantId`, `role`, `userId`
- El callback `session` debe inyectar estos campos en `session.user`
- El callback `jwt` debe incluirlos desde el token

## API Route pattern

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  // ...lógica con sesión
}
```

## Modelos Prisma

- Prefijo de tabla: snake_case via `@@map("nombre_tabla")`
- `tenant_id` como FK en todas las tablas operativas
- `Json` type para `config` y `meta` (usar `Prisma.InputJsonValue`)
- Timestamps con `@map("created_at")`, `@map("updated_at")`

## Errores comunes

- **Tipo `Record<string, unknown>` no asignable a `InputJsonValue`**: usar `Prisma.InputJsonValue` o castear con `x as Prisma.InputJsonValue`
- **Prisma no encuentra el schema**: correr `npx prisma generate` después de cambios en schema
- **NextAuth session no tiene `tenantId`**: verificar que el callback `jwt` lo está incluyendo
