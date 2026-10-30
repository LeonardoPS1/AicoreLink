# Plan: Funcionalidades del Dashboard del Cliente (Reseñas, Mi Sitio, Reportes, Soporte, Mi Cuenta)

## Objetivo
Completar las 5 secciones del dashboard del cliente que actualmente aparecen como "próximamente":
1. **Reseñas** (`/dashboard/resenas`) — gestión de reseñas y reputación
2. **Mi sitio** (`/dashboard/sitio`) — gestión del sitio web del negocio
3. **Reportes** (`/dashboard/reportes`) — reportes y analítica
4. **Soporte** (`/dashboard/soporte`) — tickets de soporte
5. **Mi cuenta** (`/dashboard/mi-cuenta`) — configuración de cuenta

## Arquitectura

### 1. Reseñas (`/dashboard/resenas`)
**Propósito:** Mostrar reseñas de Google Business, permitir responder, trackear rating promedio.

**Modelo de datos:** Reutilizar tabla `testimonials` existente + agregar campo `source` (google, manual, whatsapp) y `response`.

**API:**
- `GET /api/tenants/[id]/reviews` — lista reseñas del tenant
- `POST /api/tenants/[id]/reviews` — crear reseña manual
- `PATCH /api/tenants/[id]/reviews/[reviewId]` — responder reseña

**Página:** Tabla de reseñas con rating, autor, fecha, respuesta. Formulario para agregar reseña manual. Estadísticas de rating promedio.

**Migración:** Agregar columnas `source`, `response`, `respondedAt` a tabla `testimonials` (o crear tabla `reviews`).

### 2. Mi Sitio (`/dashboard/sitio`)
**Propósito:** Mostrar el sitio publicado del tenant, permitir editar perfil del negocio, servicios, horarios.

**Modelo de datos:** Reutilizar `BusinessProfile`, `Site`, `SitePage` existentes.

**API:**
- `GET /api/tenants/[id]/site` — info del sitio + perfil del negocio
- `PUT /api/tenants/[id]/site` — actualizar perfil del negocio
- `POST /api/tenants/[id]/site/publish` — publicar sitio

**Página:** Vista del sitio publicado (iframe/link), formulario de edición de perfil (nombre, rubro, teléfono, dirección, descripción, horarios, servicios), botón de publicar.

### 3. Reportes (`/dashboard/reportes`)
**Propósito:** Reportes y analítica del negocio: leads, conversaciones, citas, conversiones, costos.

**Modelo de datos:** Reutilizar `Lead`, `Conversation`, `Appointment`, `TenantUsage` existentes.

**API:**
- `GET /api/tenants/[id]/reports` — datos agregados por período (7d, 30d, 90d)

**Página:** Dashboard con gráficos y métricas: total leads, conversaciones, citas, tasa de conversión, costo estimado, mensajes por día.

### 4. Soporte (`/dashboard/soporte`)
**Propósito:** Sistema de tickets de soporte para que el cliente contacte a Aicore.

**Modelo de datos:** Nueva tabla `support_tickets` (id, tenantId, subject, description, status, priority, createdAt, updatedAt, resolvedAt).

**API:**
- `GET /api/tenants/[id]/support` — lista tickets del tenant
- `POST /api/tenants/[id]/support` — crear ticket
- `PATCH /api/tenants/[id]/support/[ticketId]` — actualizar ticket (solo staff)

**Página:** Lista de tickets con estado, formulario para crear nuevo ticket, detalle de ticket.

**Migración:** Crear tabla `support_tickets`.

### 5. Mi Cuenta (`/dashboard/mi-cuenta`)
**Propósito:** Configuración de la cuenta del usuario: perfil, contraseña, plan, notificaciones.

**Modelo de datos:** Reutilizar `User`, `Tenant`, `TenantBilling` existentes.

**API:**
- `GET /api/tenants/[id]/account` — info de la cuenta
- `PUT /api/tenants/[id]/account` — actualizar perfil
- `POST /api/tenants/[id]/account/password` — cambiar contraseña

**Página:** Formulario de perfil (nombre, email), cambio de contraseña, info del plan actual, preferencias de notificación.

## Migraciones necesarias
1. Alterar `testimonials` para agregar `source` y `response` (o crear `reviews`).
2. Crear `support_tickets`.

## Orden de implementación
1. Mi cuenta (más simple, reutiliza modelos existentes)
2. Mi sitio (reutiliza BusinessProfile/Site)
3. Reportes (reutiliza Lead/Conversation/Appointment/Usage)
4. Reseñas (extiende testimonials)
5. Soporte (nueva tabla)

## Criterios de salida
- Cada página renderiza sin errores
- APIs retornan datos correctos
- Nav items sin soon=true
- Tests pasando
- Commit y push a main