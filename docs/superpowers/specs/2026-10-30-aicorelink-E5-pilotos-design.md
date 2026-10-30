# Diseño — E5: Pilotos (M8, M10, M11 · Plan F4)

- **Fecha:** 2026-10-30
- **Estado:** borrador para aprobación de Leonardo
- **Spec fuente:** Plan Maestro §4 E5 (`docs/superpowers/plans/2026-10-12-aicorelink-web-master-build-plan.md`), SRD ALK-SRD-001 v2.0 §4.8 (M8), §4.10 (M10), §4.11 (M11), Plan de Ejecución ALK-PLN-001 v2.0 F4.
- **Depende de:** E4 (panel del cliente, uso y facturación) — completado.

---

## 1. Intención

E4 dejó el panel del cliente y el metering en producción. E5 es la etapa que **valida el producto con negocios reales**: onboarding de 5–10 Fundadores, seguimiento estructurado, cobro real y prueba social. Sin E5 no hay E6 (optimización y escala) ni E7 (v1.1).

El criterio de salida del Plan Maestro §9 es: *costo variable por plan validado con datos reales; ≥ 3 testimonios + 2 casos con cifras; cobro probado; backlog v1.1 priorizado*.

---

## 2. Alcance

### 2.1 Dentro de E5

| Requisito | Prioridad | Qué exige | Etapa |
|---|---|---|---|
| Onboarding ≤ 72 h | Alta | Formulario de alta de tenant + checklist de provisión (Anexo B del Plan) | E5.1 |
| Acuerdo Fundador | Alta | 40 % off x 3 meses, permanencia 6 meses, testimonio, contrato de datos | E5.1 |
| Seguimiento d1/d7/d14/d30 | Alta | n8n workflows que envían recordatorios/encuestas por WhatsApp y correo | E5.2 |
| Tablero de costo y resultado por cliente | Alta | Dashboard interno con métricas por tenant: uso, costo, leads, conversaciones, citas, margen | E5.3 |
| Facturación real | Alta | Suscripción recurrente, documento tributario (boleta/factura), falla y reintento | E5.4 |
| Testimonios y casos con cifras | Media | Captura estructurada de testimonios y casos de uso con métricas | E5.5 |
| Informe de piloto | Media | Reporte consolidado de resultados y backlog v1.1 priorizado | E5.6 |

### 2.2 Fuera de E5 (con su dónde)

| Fuera | Por qué | Dónde vive |
|---|---|---|
| A/B de landing y precios | Requiere tráfico real y datos de conversión | E6 |
| Meta Ads click-to-WhatsApp | Requiere presupuesto y reglas de decisión | E6 |
| SEO local por rubro+comuna | Requiere casos reales primero | E6 |
| Agenda avanzada (profesional/recurso) | v1.1 | E7 |
| Instagram DM, cobros ligeros | v1.2 | E8 |

---

## 3. Estado actual (verificado 2026-10-30)

### 3.1 Piezas que sirven y se reutilizan

| Pieza | Qué aporta | Veredicto |
|---|---|---|
| `lib/panel/plans.ts` | Límites por plan (conversaciones, plantillas, cambios, voz) | Se conserva; se agrega tracking de uso real |
| `lib/usage/*` | Metering y alertas 80%/100% | Se conserva; se expone en el tablero |
| `app/(admin)/metrics` | Métricas globales | Se extiende con vista por tenant |
| `app/(cliente)/*` | Panel del cliente | Se reutiliza para Fundadores (rol `cliente`) |
| `lib/billing/*` | Webhook de pagos, suscripción | Se extiende con documento tributario y reintento |
| `prisma/schema.prisma` | Tenant, TenantUsage, AuditLog, LandingLead | Se agrega tabla `PilotOnboarding`, `PilotFollowup`, `Testimonial` |

### 3.2 Huecos

1. **No existe onboarding estructurado**: el alta de tenant es manual (insertar filas). Falta formulario + checklist + asignación de responsable.
2. **No hay tablero por tenant**: las métricas son globales o por tenant individual, pero no hay vista comparativa de pilotos.
3. **Facturación incompleta**: existe webhook de billing pero no emisión de documento tributario ni reintento automático.
4. **Seguimiento manual**: no hay workflows de n8n para d1/d7/d14/d30.

---

## 4. Decisiones

### 4.1 Confirmadas (heredadas)

- **D10 (panel):** canal es Chatwoot.
- **Agregar tenant = DATOS** (insertar filas), nunca código.
- **Multi-tenancy con RLS** en todas las queries.

### 4.2 Decisiones del builder (mías, revisables)

| ID | Decisión | Alternativa descartada y por qué |
|---|---|---|
| **E5-D1** | **Onboarding como wizard de 3 pasos**: (1) datos del negocio, (2) datos de contacto/WhatsApp, (3) confirmación y checklist. Se genera un `PilotOnboarding` con estado `pending → in_progress → completed`. | Un formulario único es más rápido de implementar pero no guía al operador; el checklist es el criterio de salida (≤ 72 h). |
| **E5-D2** | **Tablero de pilotos en `/admin/pilots`**: tabla con columnas tenant, plan, fecha de alta, días desde alta, uso (conversaciones/mensajes), costo, margen, leads, citas, estado de seguimiento (d1/d7/d14/d30). Filtro por estado. | Un dashboard separado por tenant duplica código; la tabla comparativa es más útil para el operador. |
| **E5-D3** | **Facturación con Mercado Pago (suscripción) + emisión manual de boleta/factura por ahora** (documento tributario manual hasta tener integración con SII). Reintento automático de cobro fallido vía n8n (3 intentos en 7 días). | Integración directa con SII es compleja y fuera de alcance de E5; se deja para E7. |
| **E5-D4** | **Seguimiento por n8n**: 4 workflows (`pilot-d1`, `pilot-d7`, `pilot-d14`, `pilot-d30`) que envían mensaje de WhatsApp + correo con encuesta corta (3 preguntas) y registran respuesta en `PilotFollowup`. | Seguimiento manual no escala; n8n ya está en producción. |
| **E5-D5** | **Testimonios capturados en el panel del cliente**: el dueño puede enviar un testimonio (texto + rating 1-5) desde su panel; el operador lo aprueba y lo publica en la landing. | Captura por WhatsApp es más natural pero difícil de estructurar; el panel garantiza formato. |

---

## 5. Arquitectura

### 5.1 Modelo de datos

```prisma
model PilotOnboarding {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  status        String   // pending | in_progress | completed | cancelled
  founderAgreement Boolean @default(false)
  checklist     Json     // { "whatsapp_connected": bool, "kb_loaded": bool, ... }
  assignedTo    String?  // operador responsable
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model PilotFollowup {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  day         Int      // 1, 7, 14, 30
  sentAt      DateTime?
  respondedAt DateTime?
  score       Int?     // 1-5 (NPS-like)
  feedback    String?
  createdAt   DateTime @default(now())
}

model Testimonial {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  authorName  String
  authorRole  String?  // "Dueño", "Gerente", etc.
  content     String
  rating      Int      // 1-5
  approved    Boolean  @default(false)
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### 5.2 Flujo de onboarding

```
Operador → /admin/pilots/new → wizard 3 pasos
  → crea Tenant (datos) + PilotOnboarding (status: pending)
  → checklist: WhatsApp conectado, KB cargada, sitio publicado, facturación activa
  → al completar checklist → status: completed, completedAt = now()
  → dispara n8n pilot-d1 (día 1)
```

### 5.3 Tablero de pilotos

Ruta: `/admin/pilots`

Columnas:
- Tenant (nombre + rubro)
- Plan
- Alta (fecha)
- Días (desde alta)
- Conversaciones (mes actual)
- Costo (mes actual)
- Margen (ingreso - costo)
- Leads (mes actual)
- Citas (mes actual)
- Seguimiento (badges d1/d7/d14/d30)
- Estado (onboarding completed / in progress)

Filtros: por estado de onboarding, por plan, por días desde alta.

### 5.4 Facturación real

- **Suscripción**: Mercado Pago (preapproval) con webhook a `/api/billing/webhook`.
- **Documento tributario**: emisión manual por ahora (boleta/factura en papel o PDF). Campo `invoiceNumber` y `invoiceUrl` en `TenantBilling`.
- **Reintento**: si el cobro falla, n8n reintenta 3 veces en 7 días. Si sigue fallando, se suspende el servicio (feature flag `billing_active = false`).

### 5.5 Seguimiento automatizado (n8n)

4 workflows:
- `pilot-d1`: día 1 — mensaje de bienvenida + encuesta corta (3 preguntas) + registro en `PilotFollowup`.
- `pilot-d7`: día 7 — check de uso + tips + encuesta.
- `pilot-d14`: día 14 — check de satisfacción + oferta de ajuste.
- `pilot-d30`: día 30 — encuesta NPS + solicitud de testimonio.

Cada workflow:
1. Recibe `tenantId` y `day` como parámetro.
2. Envía WhatsApp con mensaje prellenado.
3. Envía correo con link a encuesta (Google Forms o interno).
4. Registra en `PilotFollowup` (sentAt).
5. Al recibir respuesta, actualiza `respondedAt`, `score`, `feedback`.

---

## 6. Etapas y criterios de cierre

| Etapa | Contenido | Cierra cuando |
|---|---|---|
| **E5.1** Onboarding flow | Wizard + checklist + modelo `PilotOnboarding` + migración | Un Fundador se da de alta en ≤ 72 h con checklist completo |
| **E5.2** Seguimiento automatizado | 4 workflows n8n + modelo `PilotFollowup` + webhook de respuesta | Los 4 mensajes se envían automáticamente en los días correctos |
| **E5.3** Tablero de pilotos | `/admin/pilots` con tabla comparativa + filtros | El operador ve costo/margen/uso de todos los pilotos en una pantalla |
| **E5.4** Facturación real | Mercado Pago + documento tributario manual + reintento | Un cobro real se procesa y se registra con número de boleta |
| **E5.5** Testimonios | Captura en panel + aprobación + publicación en landing | ≥ 3 testimonios aprobados y publicados |
| **E5.6** Informe de piloto | Reporte consolidado + backlog v1.1 priorizado | Documento con resultados y decisiones de v1.1 |

---

## 7. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Onboarding manual es lento | Pilotos se retrasan | Wizard + checklist reduce fricción |
| Facturación manual (sin SII) | Error humano en documentos | Plantilla de boleta + validación manual por operador |
| Seguimiento automatizado falla | Pilotos sin seguimiento | n8n con retry + alerta al operador si no se envía |
| Testimonios no llegan | Sin prueba social para E6 | Solicitud automática en d30 + recordatorio manual |

---

## 8. No-objetivos

- No se toca `consultorio-medico`.
- No se implementa integración directa con SII (queda para E7).
- No se rediseña la landing (eso es E6).
- No se implementa A/B testing ni Meta Ads (eso es E6).

---

## 9. Próximos pasos

1. Aprobar este spec.
2. Crear sub-plan atómico: `2026-10-30-aicorelink-E5-pilotos-plan.md`.
3. Ejecutar E5.1 (onboarding flow) primero.
