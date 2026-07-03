---
name: dokploy
description: >-
  Guía para desplegar y hacer troubleshooting en Dokploy (Docker Swarm). Incluye configuración de build
  path, variables de entorno, dominios, Traefik, y resolución de errores comunes.
---

## Uso

Incluye `@dokploy` al inicio de cualquier prompt relacionado con despliegue en Dokploy.

## Conceptos clave

- Dokploy construye desde el **build path** especificado en el servicio (Ej: `apps/dashboard`).
- **Build Type**: Dockerfile (recomendado sobre Nixpacks para proyectos con Prisma).
- Las variables de entorno se configuran en la sección **Environment** del servicio.
- Traefik se configura vía labels de Docker.

## Variables de entorno para AicoreLink

| Variable | Descripción |
|---|---|
| `AICORELINK_DATABASE_URL` | PostgreSQL connection string |
| `AICORELINK_NEXTAUTH_SECRET` | Secret de NextAuth |
| `AICORELINK_NEXTAUTH_URL` | `https://AicoreLink.aicorebots.com` |
| `NEXTAUTH_URL` | Idem (NextAuth lo requiere) |

## Labels Traefik para AicoreLink

```
traefik.enable=true
traefik.http.routers.aicorelink.rule=Host(`AicoreLink.aicorebots.com`)
traefik.http.routers.aicorelink.tls.certresolver=letsencrypt
traefik.http.services.aicorelink.loadbalancer.server.port=3000
```

## Errores comunes y soluciones

### `COPY --from=builder /app/public ./public` not found
Causa: la carpeta `public/` no existe. Solución: crear `public/.gitkeep`.

### `libssl.so.1.1` not found al arrancar Prisma
Causa: Alpine 3.20+ usa OpenSSL 3, no OpenSSL 1.1. Solución: usar `node:20-alpine` standard y `apk add --no-cache openssl` en las 3 etapas del Dockerfile.

### `npm ci` falla
Causa: falta `package-lock.json`. Solución: generar con `npm install` local y commitear.

### Build exitoso pero runtime falla (no puede conectar DB)
Causa: la base de datos no existe o las variables de entorno no están configuradas. Verificar:
1. La base `aicorelink` existe en Postgres
2. `AICORELINK_DATABASE_URL` está en Environment de Dokploy
3. Las migraciones se corrieron y el RLS se aplicó

## Debugging en Dokploy

1. Ir al servicio → pestaña **Deployments**
2. En el deployment fallido, abrir los logs de build
3. Si el build pasa pero el container no arranca, usar **Open Terminal** para inspeccionar
4. Verificar `docker service logs aicorelink-{nombre}` desde SSH del VPS
