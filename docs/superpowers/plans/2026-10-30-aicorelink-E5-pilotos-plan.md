# Plan Atómico — E5: Pilotos (M8, M10, M11 · Plan F4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validar el producto con 5–10 negocios Fundadores: onboarding ≤ 72 h, seguimiento d1/d7/d14/d30, tablero de costo/resultado por cliente, facturación real, ≥ 3 testimonios y 2 casos con cifras.

**Spec:** `docs/superpowers/specs/2026-10-30-aicorelink-E5-pilotos-design.md` (aprobado 2026-10-30).

**Depende de:** E4 (completado).

---

## E5.1 — Onboarding flow

### Tarea E5.1.1 — Migración: modelos PilotOnboarding, PilotFollowup, Testimonial

**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma`
- Create: `apps/dashboard/prisma/migrations/20261030_add_pilot_tables/migration.sql`

**Steps:**
- [ ] Agregar modelos al schema.
- [ ] Crear migración manual.
- [ ] `npx prisma migrate dev --name add_pilot_tables`.
- [ ] Commit: `feat(db): add pilot onboarding, followup and testimonial models`.

### Tarea E5.1.2 — API: POST /api/admin/pilots/onboarding

**Files:**
- Create: `apps/dashboard/app/api/admin/pilots/onboarding/route.ts`
- Test: `apps/dashboard/app/api/admin/pilots/onboarding/route.test.ts`

**Steps:**
- [ ] Test: payload válido → 201 + PilotOnboarding creado.
- [ ] Test: payload inválido → 422.
- [ ] Implementar handler con Zod + withTenant.
- [ ] Commit: `feat(pilots): add onboarding creation endpoint`.

### Tarea E5.1.3 — UI: wizard de onboarding (/admin/pilots/new)

**Files:**
- Create: `apps/dashboard/app/(admin)/pilots/new/page.tsx`
- Create: `apps/dashboard/components/admin/pilot-onboarding-wizard.tsx`

**Steps:**
- [ ] Paso 1: datos del negocio (nombre, rubro, plan).
- [ ] Paso 2: datos de contacto (email, WhatsApp, responsable).
- [ ] Paso 3: confirmación + checklist.
- [ ] Commit: `feat(pilots): add onboarding wizard UI`.

### Tarea E5.1.4 — Checklist de provisión

**Files:**
- Modify: `apps/dashboard/lib/pilots/checklist.ts` (crear)
- Test: `apps/dashboard/lib/pilots/checklist.test.ts`

**Steps:**
- [ ] Definir checklist items: `whatsapp_connected`, `kb_loaded`, `site_published`, `billing_active`.
- [ ] Función `updateChecklist(tenantId, item, value)`.
- [ ] Test de actualización.
- [ ] Commit: `feat(pilots): add provisioning checklist logic`.

---

## E5.2 — Seguimiento automatizado

### Tarea E5.2.1 — Modelo PilotFollowup + API

**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma` (ya en E5.1.1)
- Create: `apps/dashboard/app/api/admin/pilots/followup/route.ts`
- Test: `apps/dashboard/app/api/admin/pilots/followup/route.test.ts`

**Steps:**
- [ ] Test: POST con day 1/7/14/30 → crea PilotFollowup.
- [ ] Test: PATCH con respuesta → actualiza respondedAt, score, feedback.
- [ ] Implementar handlers.
- [ ] Commit: `feat(pilots): add followup API`.

### Tarea E5.2.2 — Workflows n8n (pilot-d1, d7, d14, d30)

**Files:**
- Create: `apps/dashboard/n8n-workflows/pilot-d1.json`
- Create: `apps/dashboard/n8n-workflows/pilot-d7.json`
- Create: `apps/dashboard/n8n-workflows/pilot-d14.json`
- Create: `apps/dashboard/n8n-workflows/pilot-d30.json`

**Steps:**
- [ ] Cada workflow: recibe tenantId + day, envía WhatsApp + correo, registra en PilotFollowup.
- [ ] Documentar importación en README de n8n-workflows.
- [ ] Commit: `feat(n8n): add pilot followup workflows`.

---

## E5.3 — Tablero de pilotos

### Tarea E5.3.1 — API: GET /api/admin/pilots

**Files:**
- Create: `apps/dashboard/app/api/admin/pilots/route.ts`
- Test: `apps/dashboard/app/api/admin/pilots/route.test.ts`

**Steps:**
- [ ] Test: retorna lista de pilotos con métricas agregadas (uso, costo, margen, leads, citas).
- [ ] Implementar con aggregation por tenant.
- [ ] Commit: `feat(pilots): add pilots list API with aggregated metrics`.

### Tarea E5.3.2 — UI: /admin/pilots

**Files:**
- Create: `apps/dashboard/app/(admin)/pilots/page.tsx`
- Create: `apps/dashboard/components/admin/pilots-table.tsx`

**Steps:**
- [ ] Tabla con columnas: tenant, plan, alta, días, conversaciones, costo, margen, leads, citas, seguimiento, estado.
- [ ] Filtros: estado onboarding, plan, días desde alta.
- [ ] Commit: `feat(pilots): add pilots dashboard page`.

---

## E5.4 — Facturación real

### Tarea E5.4.1 — Mercado Pago: suscripción + webhook

**Files:**
- Modify: `apps/dashboard/app/api/billing/webhook/route.ts`
- Create: `apps/dashboard/lib/billing/mercadopago.ts`
- Test: `apps/dashboard/lib/billing/mercadopago.test.ts`

**Steps:**
- [ ] Integrar preapproval de Mercado Pago.
- [ ] Webhook procesa payment notifications.
- [ ] Test de webhook con payload mock.
- [ ] Commit: `feat(billing): integrate Mercado Pago subscriptions`.

### Tarea E5.4.2 — Documento tributario manual

**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma` (agregar `invoiceNumber`, `invoiceUrl` a TenantBilling o crear tabla)
- Create: `apps/dashboard/app/api/admin/billing/invoice/route.ts`

**Steps:**
- [ ] Endpoint para registrar número de boleta/factura y URL del PDF.
- [ ] Commit: `feat(billing): add manual invoice registration`.

### Tarea E5.4.3 — Reintento de cobro fallido (n8n)

**Files:**
- Create: `apps/dashboard/n8n-workflows/billing-retry.json`

**Steps:**
- [ ] Workflow: 3 intentos en 7 días. Si falla, setea `billing_active = false`.
- [ ] Commit: `feat(n8n): add billing retry workflow`.

---

## E5.5 — Testimonios

### Tarea E5.5.1 — Modelo Testimonial + API

**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma` (ya en E5.1.1)
- Create: `apps/dashboard/app/api/testimonials/route.ts`
- Create: `apps/dashboard/app/api/admin/testimonials/route.ts`
- Test: `apps/dashboard/app/api/testimonials/route.test.ts`

**Steps:**
- [ ] POST (cliente): crea testimonio (authorName, content, rating).
- [ ] GET (admin): lista todos.
- [ ] PATCH (admin): aprueba/publica.
- [ ] Commit: `feat(testimonials): add testimonial API`.

### Tarea E5.5.2 — UI: captura en panel del cliente

**Files:**
- Create: `apps/dashboard/app/(cliente)/testimonio/page.tsx`
- Create: `apps/dashboard/components/cliente/testimonial-form.tsx`

**Steps:**
- [ ] Formulario con rating 1-5 y texto.
- [ ] Commit: `feat(testimonials): add client testimonial form`.

### Tarea E5.5.3 — Publicación en landing

**Files:**
- Modify: `apps/dashboard/lib/marketing/copy.ts` (o nuevo `lib/testimonials.ts`)
- Modify: `apps/dashboard/components/marketing/testimonials-section.tsx`

**Steps:**
- [ ] Fetch testimonios aprobados y publicados.
- [ ] Render en landing.
- [ ] Commit: `feat(marketing): display approved testimonials on landing`.

---

## E5.6 — Informe de piloto

### Tarea E5.6.1 — Generación de reporte

**Files:**
- Create: `apps/dashboard/app/api/admin/pilots/report/route.ts`
- Create: `apps/dashboard/lib/pilots/report.ts`

**Steps:**
- [ ] Agregar métricas de todos los pilotos: uso, costo, margen, leads, citas, testimonios.
- [ ] Generar PDF o markdown.
- [ ] Commit: `feat(pilots): add pilot report generation`.

---

## Criterios de salida (Plan Maestro §9)

- [ ] Costo variable por plan validado con datos reales.
- [ ] ≥ 3 testimonios aprobados y publicados.
- [ ] 2 casos con cifras documentados.
- [ ] Cobro real procesado y registrado.
- [ ] Backlog v1.1 priorizado.

---

## Orden de ejecución

```
E5.1.1 → E5.1.2 → E5.1.3 → E5.1.4
E5.2.1 → E5.2.2
E5.3.1 → E5.3.2
E5.4.1 → E5.4.2 → E5.4.3
E5.5.1 → E5.5.2 → E5.5.3
E5.6.1
```

E5.1 bloquea E5.2, E5.3, E5.4, E5.5 (necesitan tabla PilotOnboarding).
E5.2 independiente de E5.3.
E5.4 independiente de E5.5.
E5.6 depende de todos.