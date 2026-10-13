# AicoreLink Web — Plan Maestro de Construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ordenar, en una sola hoja de ruta paso a paso, la construcción de AicoreLink Web (sitios con IA que atienden, agendan y responden para negocios locales), reconciliando el Plan de Ejecución v2.0 (ALK-PLN-001), el SRD v2.0 (ALK-SRD-001) y el código ya existente en `apps/dashboard`.

**Architecture:** Aplicación Next.js 14 (App Router) multi-tenant servida por Dokploy. Un mismo deploy sirve la landing pública, el panel interno (`(admin)`), el portal del cliente (`(cliente)`) y las APIs. La "fábrica de sitios" produce sitios de clientes a partir de plantillas por rubro; n8n orquesta mensajería (WhatsApp/voz), Ollama/OpenRouter atienden la IA, PostgreSQL (con RLS) aísla cada tenant.

**Tech Stack:** Next.js 14.2.15 · TypeScript 5.5 · Tailwind 3.4.4 · Prisma 5.20 + PostgreSQL (RLS) · NextAuth v4 (Credentials+JWT) · n8n self-hosted · Ollama (Mistral) + OpenRouter (GLM) · Meta Cloud API (WhatsApp) + ElevenLabs (TTS) + Whisper (STT) · Docker / Dokploy / Traefik · Cloudflare · vitest + Playwright.

**Spec (fuentes):**
- `AicoreLink_Web_Plan_de_Ejecucion.md` (ALK-PLN-001 v2.0) — fases, manual de copy, captación, precios, backlog.
- `AicoreLink_Web_SRD.pdf.md` (ALK-SRD-001 v2.0) — requisitos M1–M22, anexos A–E.
- `docs/superpowers/specs/2026-10-11-aicorelink-saas-redesign-design.md` — spec técnica previa (stack, boundaries, estructura).
- `docs/superpowers/plans/2026-10-11-aicorelink-landing-plan.md` — plan de landing ya ejecutado (referencia de formato).

---

## 0. Cómo leer este plan

Cada etapa (`E0`…`E9`) declara: **objetivo**, **entregables**, **criterio de salida** (una fase no se cierra sin cumplirlo) y **trazabilidad** (IDs del SRD `M*` / `RF-*` y pasos del Plan `P*`). La etapa **E1** (la inmediata) baja a tareas atómicas ejecutables con TDD; las etapas posteriores se ordenan a nivel de entregable y se expanden en **sub-planes** dedicados (sección 7).

**Responsables** (del Plan): `L` = Leonardo · `IA` = agente/IA · `L+IA` = conjunto · `A` = automatización (n8n).

---

## 1. Estado actual del repositorio (verificado 2026-10-12)

Branch actual: `main`. Landing ya integrada (`edca80a feat(landing): finalize all D1-D5 blocks...`).

### 1.1 Lo que YA existe
- **Landing pública** (`app/(marketing)/page.tsx` + `app/(marketing)/layout.tsx`): 13 secciones, tokens de diseño, copy en `lib/marketing/copy.ts`, rubros en `lib/marketing/verticals.ts`, SEO/OG/JSON-LD (`lib/marketing/site.ts`, `lib/marketing/structured-data.ts`), analítica (`lib/analytics.ts`), lead form (`components/marketing/lead-form.tsx` + `lib/leads/schema.ts`) → `POST /api/leads` → `lib/leads/notify.ts` (webhook n8n con HMAC).
- **Base multi-tenant** (Prisma): `Tenant`, `User`, `TenantUser`, `TenantChannel`, `ChannelCredential`, `TenantUsage`, `AuditLog`, `CostRate`, `Conversation`, `Message`, `LandingLead`. RLS en `apps/dashboard/prisma/rls.sql`. Migraciones: initial, cost_rates, conversations_messages, audio_fields, descripcion_tenant_channel, landing_leads.
- **Libs de plataforma**: `lib/auth.ts`, `lib/rbac.ts`, `lib/tenant-context.ts` (withTenant/RLS), `lib/entitlements.ts`, `lib/audit.ts`, `lib/totp.ts`, `lib/webhook.ts`; `lib/ai/{ollama-client,openrouter-client,router}.ts`; `lib/voice/{stt,tts}.ts`; `lib/whatsapp/{config,meta-client,resolve-tenant}.ts`.
- **Panel** `(admin)`: infraestructura, métricas, tenants, tenants/[tenantId]. **Portal** `(cliente)`: dashboard, whatsapp, whatsapp/conversaciones. **Auth**: `app/login`, `app/api/auth/*`.
- **APIs**: `billing/webhook`, `leads`, `metrics`, `tenants/*` (channels, billing, conversations, health, metrics), `webhooks/{n8n,whatsapp}`.
- **Calidad**: 24 archivos de test (vitest + Playwright e2e responsive 375/768/1440). `lighthouserc.json` en la raíz.
- **n8n**: `apps/dashboard/n8n-workflows/landing-lead-webhook.json`.

### 1.2 Lo que FALTA / está desalineado (huecos vs. los documentos nuevos)
1. **Precios y copy desalineados**: la landing usa USD ($49/$99/$199) y español neutro; el Plan v2.0 fija **CLP** (Semilla $0 / Starter $19.990 / Growth $49.990 / Elite $99.990 + IVA) y **tuteo chileno neutro, nunca voseo**.
2. **M2 · Herramientas interactivas**: falta **calculadora** ("¿cuánto te cuesta no responder?"), **demo de chat real** por rubro (n8n + Ollama + base de conocimiento + límite de tasa), **demo de voz**, y **test de atención** como imán de leads. El selector de rubro y el chat-mockup actuales son estáticos.
3. **M4 · Fábrica de sitios**: no existen plantillas por rubro, generador anti-invención, panel de revisión con checklist de publicación, ni publicación multi-sitio (subdominio/CNAME + certificado).
4. **M5 · Módulos del sitio cliente** (Starter/Growth/Elite por flag): calendario de reservas, recordatorios, solicitudes de reseña, derivación a humano, voz.
5. **M6/M7 · Mensajería + IA**: faltan flujos n8n versionados/clonables, base de conocimiento por tenant, guardarraíles y pruebas adversarias.
6. **M8/M10/M11**: panel del cliente con leads/citas/uso, medición de costo por tenant con alertas de uso justo, reporte mensual, atribución UTM end-to-end, tablero de embudo.
7. **M9**: alta de tenant = operación de DATOS (no código) — hoy hay base pero falta el pipeline de provisión y el aislamiento probado de extremo a extremo.
8. **Nuevos requisitos v2 de la landing** (M2/M11/M12): UTM + consentimiento en cada CTA, páginas legales (privacidad, términos, cookies), footer de ecosistema común, número real de WhatsApp.
9. **Deploy**: no hay `.github/workflows` en el repo; verificar que el auto-deploy a Dokploy (build path `apps/dashboard`) esté operativo y medir Lighthouse real en la VPS.

---

## 2. Restricciones globales (aplican a TODAS las tareas)

Copiadas del spec y del Plan; cada tarea las hereda implícitamente.

- **Calidad antes de commit**: `npm run lint` + `npm run typecheck` + `npm run test` en verde (en `apps/dashboard`).
- **Multi-tenancy**: toda query de datos de cliente pasa por `withTenant()` (RLS). El rol de la app **nunca** tiene `BYPASSRLS`.
- **Agregar tenant = DATOS** (insertar filas), nunca código. Sin ramas ni deploys por cliente.
- **Validación**: todo input externo se valida con **Zod** (formularios, webhooks, APIs).
- **Secretos**: nunca commitear `.env`; usar variables sin prefijo (DATABASE_URL, NEXTAUTH_SECRET, OLLAMA_BASE_URL, OPENROUTER_API_KEY, ENCRYPTION_KEY, ELEVENLABS_*, WHISPER_URL, N8N_LEADS_WEBHOOK_SECRET).
- **Copy**: landing en **tuteo chileno neutro**; **nunca voseo**; cero jerga técnica sin explicar; cifras solo reales o marcadas como estimación del visitante; **la IA nunca inventa** precios/horarios/promesas.
- **Artefactos**: código, identificadores y comentarios en **inglés**; copy y labels de UI en **español**.
- **Precios**: en CLP, con **IVA indicado aparte** en todos los valores.
- **Commits**: convencionales, en inglés, sin atribución de IA.
- **Un humano en el punto crítico**: ningún sitio de cliente se publica sin revisión humana con checklist.

---

## 3. Mapa de módulos y estructura objetivo

Se respeta la estructura existente; se agrega lo nuevo por responsabilidad.

```
apps/dashboard/
├── app/
│   ├── (marketing)/           # Landing pública — EXISTE
│   │   ├── page.tsx
│   │   ├── herramientas/      # NUEVO: calculadora, test de atención, demo (M2)
│   │   ├── legal/             # NUEVO: privacidad, términos, cookies (M12/legales)
│   │   └── opengraph-image.tsx
│   ├── (portal)/              # NUEVO: portal del cliente (migrar/renombrar (cliente))
│   ├── (admin)/               # EXISTE: panel interno
│   ├── (fabrica)/             # NUEVO: panel de revisión/edición de sitios (M4)
│   ├── sitio/[domain]/        # NUEVO: host multi-sitio para sitios de clientes (M4/M5)
│   ├── login/, layout.tsx
│   └── api/
│       ├── leads/             # EXISTE
│       ├── tools/             # NUEVO: calculadora/test de atención (M2/M12)
│       ├── demos/             # NUEVO: chat demo por rubro con rate limit (M2/M6)
│       ├── sites/             # NUEVO: fábrica — generar, revisar, publicar (M4)
│       ├── tenants/*          # EXISTE: extender con sites, usage, knowledge (M5/M8/M10)
│       └── webhooks/*         # EXISTE: n8n, whatsapp — agregar voice, payments (M6/M15)
├── components/
│   ├── marketing/             # EXISTE — extender con hero chat real, calculadora
│   ├── ui/                    # EXISTE
│   ├── portal/                # NUEVO
│   └── fabrica/               # NUEVO
├── lib/
│   ├── marketing/, leads/     # EXISTE
│   ├── sites/                 # NUEVO: templates, generator, publish (M4)
│   ├── knowledge/             # NUEVO: base de conocimiento + guardarraíles (M7)
│   ├── usage/                 # NUEVO: metering + alertas de uso justo (M10)
│   └── tenants/               # NUEVO: provisioning (M9)
├── n8n-workflows/             # EXISTE — versionar flujos estándar (M6)
└── prisma/                    # schema + rls.sql + migraciones a mano
```

---

## 4. Etapas de construcción (ordenadas)

Orden pensado para: (a) no construir dos veces, (b) medir costo desde el cliente 1, (c) habilitar pilotos lo antes posible.

---

### E0 · Definiciones y cimientos (Plan F0 · semana 1)
**Objetivo:** cerrar lo que condiciona todo lo demás.
**Entregables:** documento de producto de una página; hoja de economía por plan (margen positivo en escenario normal); 3 rubros iniciales elegidos con matriz; policy comercial (precios, permanencia, garantía 30 días, cupo de cambios); decisión de canal/numeración WhatsApp (Meta Cloud API); proveedor de voz (o postergar Elite-voz); hosting de sitios cliente (CNAME + cert automático probado con dominio de prueba); lista de eventos de analítica.
**Criterio de salida:** rubros, canal WhatsApp, hosting y precios hipótesis decididos y escritos; SRD v1.0 validado; D1–D8 con fecha.
**Trazabilidad:** Plan P0.1–P0.9 · SRD §3, §16.
**Estado:** parcial — precios/rubros del Plan v2.0 disponibles; falta validar hosting de sitios cliente y prototipo de voz.

---

### E1 · Landing pública completa (Plan F1–F2 · SRD M1, M2, M3, M11, M12) — **IMMEDIATA**
**Objetivo:** dejar la landing en producción, medible, con copy/precios v2 y herramientas interactivas que son prueba tangible antes de pedir datos.
**Entregables:**
1. **Alineación copy/precios v2**: CLP + IVA, tuteo chileno neutro (nunca voseo), planes Semilla/Starter/Growth/Elite, "Cómo funciona" (4 pasos del Plan 10.5), dolores (8 tarjetas del Plan 10.3), FAQ (Plan 10.8), mensajes prellenados de WhatsApp (Plan 10.9), sección "Sin cautiverio" + "Quiénes somos" + CTA final (Plan 10.7).
2. **M2 Herramientas interactivas**: calculadora con resultado compartible (`/herramientas/calculadora`), test de atención, chat demo por rubro (n8n+Ollama+base de conocimiento+rate limit+guardarraíles), demo de voz con transcripción.
3. **M3/M12 Captura v2**: cada CTA genera lead con **UTM + consentimiento**; formulario de 3 campos; WhatsApp prellenado por sección/plan/calculadora/demo; notificación al operador + respuesta automática; registro de lead en ≤ 10 s.
4. **M11 Analítica**: eventos de P0.8 (cta_click, whatsapp_click, form_submit, vertical_view, tools_start, tools_finish, demo_message) + atribución UTM + tablero único del embudo.
5. **Legales/SEO**: páginas de privacidad, términos, aviso de cookies; JSON-LD (Organization/Service/FAQPage/Breadcrumb); sitemap/robots; OG.
6. **Ecosistema**: número real de WhatsApp en todos los sitios; footer de ecosistema común en las 4 webs.
7. **Calidad**: Playwright del recorrido visita→CTA→lead; a11y AA; rendimiento móvil ≥ 90; prueba en 3 teléfonos reales; prueba de abuso en demos.
8. **Deploy**: auto-deploy Dokploy verificado (build path `apps/dashboard`); Lighthouse real medido en la VPS.
**Criterio de salida:** cada CTA genera un lead registrado y notificado; la analítica mide todo el embudo; rendimiento/a11y/abuso superados; landing v2 publicada.
**Trazabilidad:** Plan P1.1–P1.8, P2.1–P2.11 · SRD M1, M2, M3, M11, M12 · RF-LND-*, RF-INT-*, RF-ANA-*, RN-01, RN-08.
**Estado:** la base está hecha; faltan 1–8 (sobre todo los puntos 1, 2 y 3).

---

### E2 · Fábrica de sitios (Plan F3 · SRD M4, M5, M9)
**Objetivo:** producir un sitio de cliente de forma repetible en 48–72 h.
**Entregables:** esquema multi-tenant con pruebas automáticas de aislamiento (RN-04); perfil de negocio (form + recepción de archivos por WhatsApp); **plantillas por rubro (3)** con estructuras 3/5/10 páginas y copy base con variables; **generador IA anti-invención** (solo datos del perfil, marca pendientes; 0 datos fabricados en 10 borradores, ≤ 15 min); **panel interno de revisión** (preview, edición, checklist, aprobación obligatoria, versionado+reversión); **publicación** (host multi-sitio, subdominio provisional, dominio propio por CNAME + cert automático, reversión rápida).
**Criterio de salida:** un sitio de cliente se produce, revisa y publica con checklist; publicar sitio nuevo ≤ 10 min sin tocar config a mano; prueba de aislamiento de tenant en verde.
**Trazabilidad:** Plan P3.1–P3.6 · SRD M4, M5, M9 · RF-FAB-01..08, RN-04.
**Depende de:** E1 (estructura de deploy), E0 (rubros/hosting).

---

### E3 · Mensajería, IA y guardarraíles (Plan F3 · SRD M6, M7, M18)
**Objetivo:** que cada sitio atienda de verdad.
**Entregables:** **flujos n8n estándar versionados y clonables** por tenant (lead, respuesta, reserva, recordatorio, reseña, reporte mensual) — un tenant nuevo se configura cambiando parámetros; **base de conocimiento** por tenant + guardarraíles (temas prohibidos, respuestas fijas, estados de conversación); **módulos Starter** (form, botón WhatsApp, chat básico ≥ 90% de 30 preguntas por rubro); **módulos Growth** (calendario de reservas sin doble agendamiento, recordatorios, solicitud de reseña con filtro de satisfacción); **módulos Elite** (chat IA completo con derivación a humano, recepcionista de voz ≤ 1,5 s/turno con aviso de IA y de grabación).
**Criterio de salida:** un tenant nuevo se activa cambiando solo parámetros; calidad del chat ≥ 90% (30 FAQ + 50 fuera de base); pruebas adversarias de IA en verde.
**Trazabilidad:** Plan P3.7–P3.10, P3.13 · SRD M6, M7, M18 · RF-MSX-*, RF-QLT-*.
**Depende de:** E2 (sitios), `lib/ai` y `lib/whatsapp` existentes.

---

### E4 · Panel del cliente, uso y facturación (Plan F3 · SRD M8, M10, M11)
**Objetivo:** que el cliente vea valor y que el negocio no pierda margen.
**Entregables:** **medición de uso y costo por tenant** con alertas de 80%/100% del uso justo y alerta de margen; **panel del cliente** (leads, conversaciones, citas, uso); **reporte mensual automático** por WhatsApp y correo; facturación de punta a punta (suscripción, documento tributario, falla y reintento).
**Criterio de salida:** reporte de prueba recibido con cifras correctas; RF-BIL-02/03 y RC-04 verificados; alertas disparando.
**Trazabilidad:** Plan P3.11–P3.12 · SRD M8, M10, M11 · RF-BIL-*, RF-ANA-*, RC-04.
**Depende de:** E3.

---

### E5 · Pilotos (Plan F4 · semanas 5–8)
**Objetivo:** validar costo, calidad y valor con negocios reales y conseguir prueba social.
**Entregables:** 5–10 negocios Fundadores (acuerdo con 40% off x 3 meses, permanencia, testimonio, contrato de datos); onboarding ≤ 72 h (Anexo B); seguimiento días 1/7/14/30; tablero de costo y resultado por cliente; **≥ 3 testimonios** y 2 casos con cifras; cobro/facturación reales; informe de piloto.
**Criterio de salida:** costo variable por plan validado con datos; ≥ 3 testimonios y 2 casos con cifras; cobro probado; backlog v1.1 priorizado.
**Trazabilidad:** Plan P4.1–P4.8.

---

### E6 · Optimización y escala (Plan F5 · semanas 9–12)
**Objetivo:** embudo medido end-to-end y prueba social real en la landing.
**Entregables:** reemplazar prueba social genérica por testimonios en video y casos con cifras; A/B del titular/CTA; ajuste de precios/límites con datos; Meta Ads click-to-WhatsApp con reglas de decisión; alianzas y referidos; SEO local (3 páginas por rubro+comuna); SLA de soporte + base de ayuda; backlog v1.1.
**Criterio de salida:** embudo medido con costo y conversión por canal; precios ajustados con datos; backlog v1.1 priorizado.
**Trazabilidad:** Plan P5.1–P5.8.

---

### E7 · Paridad esencial — v1.1 (Plan F6 · semanas 13–20 · SRD M12, M13, M14, M17, M18)
Agenda avanzada (profesional/recurso, página de reservas, bloqueos), sincronización bidireccional con Google Calendar, notas de voz, coexistencia de WhatsApp, configuración del asistente, modo aprendizaje + panel de transparencia + revisión humana 30 días, asistente del dueño + resumen diario + dinero recuperado, generador desde ficha de Google, importación/exportación, llamada perdida→WhatsApp, prueba social real, Academia en iapo.cl, centro de confianza. **Trazabilidad:** Plan P6.1–P6.15 · SRD M12–M14, M17, M18.

### E8 · Diferenciación — v1.2 (Plan F7 · semanas 21–28 · SRD M13–M16, M19–M21)
Instagram DM, cobros ligeros (Mercado Pago), packs por rubro (abogados, taller, inmobiliaria, clínica, belleza), CRM ligero, reactivación con IA, Meta API de conversiones + atribución hasta el pago, conectores/capa sobre agendas externas, comparativas con fuente y fecha (revisión legal), programa de socios, PWA + idiomas. **Trazabilidad:** Plan P7.1–P7.10 · SRD M13–M16, M19–M21.

### E9 · Escala y comunidad — v1.3 (Plan F8 · semanas 29–36 · SRD M22)
Directorio AicoreLink (mapa, reseñas, por comuna/rubro, con consentimiento), multi-sede, pack belleza completo, add-ons de marketing, SEO programático, evaluación continua de IA + hoja de ruta pública + alojamiento dedicado. **Trazabilidad:** Plan P8.1–P8.6 · SRD M22.

---

## 5. Tareas atómicas — E1 (fase inmediata)

> Solo E1 se detalla a nivel atómico por ahora (es lo ejecutable ya). E2–E9 se expanden en sub-planes (sección 7). Cada tarea termina con `lint + typecheck + test` verdes y un commit.

### E1.0 · Alinear copy y precios a v2

**Files:**
- Modify: `apps/dashboard/lib/marketing/copy.ts`
- Modify: `apps/dashboard/lib/marketing/verticals.ts`
- Modify: `apps/dashboard/lib/marketing/site.ts`
- Test: `apps/dashboard/lib/marketing/*.test.ts` (crear/extender)

**Interfaces:**
- Produces: `PLANS` con `{ id: 'semilla'|'starter'|'growth'|'elite', name, priceCLP, priceNote: '+ IVA', tagline, features[] }`; `whatsappUrl(context: string, rubro?: string): string`; `PRESET_MESSAGES` por origen (hero, starter, growth, elite, calculadora, demo).
- Consumes: nada.

- [ ] **Step 1: Test de precios/planes** — assert `PLANS.map(p=>p.priceCLP)` = `[0, 19990, 49990, 99990]`; cada `priceNote` incluye `'IVA'`; existe `bestSeller` en Growth.
- [ ] **Step 2: Correr el test (falla)** — `npm run test -- copy` → FAIL.
- [ ] **Step 3: Reescribir `PLANS` en `copy.ts`** con los 4 planes del Plan §23 y sus posicionamientos (Plan 10.6); reescribir dolores (8), cómo funciona (4 pasos), FAQ (7), mensajes prellenados (Plan 10.9). Reemplazar todo "vos" por "tú".
- [ ] **Step 4: Correr el test (pasa)** — `npm run test -- copy` → PASS.
- [ ] **Step 5: Commit** — `refactor(marketing): align plans and copy to v2 pricing`.

### E1.1 · Calculadora "¿Cuánto te cuesta no responder?"

**Files:**
- Create: `apps/dashboard/app/(marketing)/herramientas/calculadora/page.tsx`
- Create: `apps/dashboard/components/marketing/lead-cost-calculator.tsx` (client)
- Create: `apps/dashboard/lib/tools/calculator.ts`
- Test: `apps/dashboard/lib/tools/calculator.test.ts`

**Interfaces:**
- Produces: `computeLostRevenue(input: { messagesPerWeek: number; unansweredPct: number; avgTicketCLP: number; closeRate: number }): { monthlyLostCLP: number }`.
- Consumes: `whatsappUrl`, `PRESET_MESSAGES` (E1.0).

- [ ] **Step 1: Test** — `computeLostRevenue({messagesPerWeek:40, unansweredPct:20, avgTicketCLP:25000, closeRate:30}).monthlyLostCLP === 26000` (fórmula documentada en el propio test).
- [ ] **Step 2: Correr (falla)** → FAIL.
- [ ] **Step 3: Implementar `computeLostRevenue`**; UI con 4 campos del Plan 10.4, resultado + "Es una estimación con los datos que ingresaste", botón "Quiero recuperar esos clientes" con mensaje prellenado de WhatsApp.
- [ ] **Step 4: Correr (pasa)** → PASS.
- [ ] **Step 5: Commit** — `feat(marketing): add lead-cost calculator`.

### E1.2 · Test de atención (imán de leads)

**Files:**
- Create: `apps/dashboard/app/(marketing)/herramientas/test-atencion/page.tsx`
- Create: `apps/dashboard/lib/tools/attention-test.ts`
- Test: `apps/dashboard/lib/tools/attention-test.test.ts`

**Interfaces:**
- Produces: `scoreAttention(answers): { score: 0..100; gaps: string[] }`; resultado abre WhatsApp con puntaje y brechas.
- Consumes: `computeLostRevenue` (E1.1) para el monto estimado.

- [ ] **Step 1: Test** de `scoreAttention` (casos: todo "sí" = 100, todo "no" = 0, mixto = promedio ponderado).
- [ ] **Step 2: Correr (falla)** → FAIL.
- [ ] **Step 3: Implementar + UI** (Plan 21.1).
- [ ] **Step 4: Correr (pasa)** → PASS.
- [ ] **Step 5: Commit** — `feat(marketing): add attention test lead magnet`.

### E1.3 · Demo de chat real por rubro

**Files:**
- Create: `apps/dashboard/app/(marketing)/herramientas/demo/page.tsx`
- Create: `apps/dashboard/components/marketing/demo-chat.tsx` (client)
- Create: `apps/dashboard/app/api/demos/route.ts`
- Create: `apps/dashboard/lib/demos/rate-limit.ts`
- Create: `apps/dashboard/lib/demos/knowledge.ts` (business demo por rubro)
- Test: `apps/dashboard/lib/demos/rate-limit.test.ts`, `apps/dashboard/app/api/demos/route.test.ts`

**Interfaces:**
- Produces: `POST /api/demos` body `{ rubro, message, sessionId }` → `{ reply }`; límite de tasa por IP/sesión.
- Consumes: `lib/ai/router.ts` (existente), `lib/demos/knowledge.ts`.

- [ ] **Step 1: Test** del rate limiter (N+1ª llamada → 429) y del handler (mock del router).
- [ ] **Step 2: Correr (falla)** → FAIL.
- [ ] **Step 3: Implementar** rate limit + handler con guardarraíles (sin datos sensibles, deriva a humano ante dudas) + UI de chat.
- [ ] **Step 4: Correr (pasa)** → PASS.
- [ ] **Step 5: Prueba de abuso** — 30 mensajes seguidos no generan costo fuera de control; documentar resultado.
- [ ] **Step 6: Commit** — `feat(marketing): add live per-vertical chat demo with rate limit`.

### E1.4 · Demo de voz

**Files:**
- Create: `apps/dashboard/components/marketing/voice-demo.tsx`
- Create: `apps/dashboard/app/api/demos/voice/route.ts`
- Test: `apps/dashboard/app/api/demos/voice/route.test.ts`

**Interfaces:**
- Produces: audio + transcripción de una demo de 20–40 s; aviso de IA y de grabación.
- Consumes: `lib/voice/{tts,stt}.ts` (existentes).

- [ ] **Step 1: Test** del handler (mock TTS) — responde audio y transcripción.
- [ ] **Step 2: Correr (falla)** → FAIL.
- [ ] **Step 3: Implementar** (guion y audio de P1.7); UI con aviso de IA/grabación.
- [ ] **Step 4: Correr (pasa)** → PASS.
- [ ] **Step 5: Commit** — `feat(marketing): add voice demo with transcript`.

### E1.5 · UTM + consentimiento en todos los CTAs y leads

**Files:**
- Modify: `apps/dashboard/lib/leads/schema.ts` (agregar `utm` + `consent`)
- Modify: `apps/dashboard/app/api/leads/route.ts`
- Modify: `apps/dashboard/components/marketing/lead-form.tsx`
- Modify: `prisma/schema.prisma` + migración a mano `2026XXXX_add_lead_utm_consent`
- Test: `apps/dashboard/lib/leads/schema.test.ts`, `apps/dashboard/app/api/leads/route.test.ts`

**Interfaces:**
- Produces: `LeadSchema` con `utm: { source?, medium?, campaign?, content?, term? }` y `consent: true`; columna(s) nuevas en `LandingLead`.
- Consumes: E1.0 (`PRESET_MESSAGES`).

- [ ] **Step 1: Test** — payload sin `consent:true` → 422; con UTM → persiste.
- [ ] **Step 2: Correr (falla)** → FAIL.
- [ ] **Step 3: Implementar** migración + schema + captura de UTM desde la URL + checkbox de consentimiento.
- [ ] **Step 4: Correr (pasa)** → PASS.
- [ ] **Step 5: Commit** — `feat(leads): capture utm and consent on every cta`.

### E1.6 · Páginas legales + cookies

**Files:**
- Create: `apps/dashboard/app/(marketing)/legal/{privacidad,terminos,cookies}/page.tsx`
- Create: `apps/dashboard/components/marketing/cookie-notice.tsx`
- Test: `apps/dashboard/app/(marketing)/legal/*.test.tsx`

**Interfaces:** Consumes `lib/marketing/site.ts` (SITE_URL). Produces rutas `/legal/*` y aviso de cookies.

- [ ] **Step 1–5:** test de render + enlaces desde el footer; commit `feat(marketing): add legal pages and cookie notice`.

### E1.7 · Analítica v2 + tablero de embudo

**Files:**
- Modify: `apps/dashboard/lib/analytics.ts`, `apps/dashboard/components/marketing/analytics-tracker.tsx`
- Create: `apps/dashboard/app/(admin)/embudo/page.tsx`
- Test: `apps/dashboard/lib/analytics.test.ts`

**Interfaces:** Produces eventos `tools_start`, `tools_finish`, `demo_message` además de los existentes; tablero del embudo en `(admin)`.

- [ ] **Step 1–5:** test de eventos + tablero; commit `feat(analytics): track tools and demo events`.

### E1.8 · Footer de ecosistema + número real de WhatsApp

**Files:** Modify `apps/dashboard/components/marketing/footer.tsx`, `lib/marketing/copy.ts` (WHATSAPP_PHONE real).

- [ ] **Step 1–5:** test de footer idéntico + `wa.me` real; commit `chore(ecosystem): unify footer and real whatsapp number`.

### E1.9 · QA E1 + deploy con Lighthouse real

**Files:** Modify `apps/dashboard/e2e/` (recorrido visita→CTA→lead).

- [ ] **Step 1:** Playwright del recorrido completo.
- [ ] **Step 2:** `npm run test:e2e` verde en 375/768/1440.
- [ ] **Step 3:** `npx lhci autorun` contra la URL de producción de la VPS (no dev) y registrar P/A11y/BP/SEO.
- [ ] **Step 4:** Verificar auto-deploy Dokploy (build path `apps/dashboard`).
- [ ] **Step 5: Commit** — `test(marketing): add full funnel e2e and prod lighthouse`.

---

## 6. Review Focus (5 modos de falla más probables)

Cada línea se fija con un test en la tarea que posee ese código (indicada).

1. **Rate limit de demos evadible** (por `sessionId` falsificado / IP compartida) → costo descontrolado. *Test en E1.3.*
2. **UTM perdida o consentimiento ausente** → leads no atribuibles o no conformes. *Test en E1.5.*
3. **IA del demo inventa precios/horarios** → rompe la promesa "la IA no inventa". *Test de guardarraíl en E1.3.*
4. **Copy con voseo o cifras inventadas** → incumple regla de voz/copy. *Assert en E1.0.*
5. **Aislamiento RLS en la fábrica** (un tenant ve otro) → fuga multi-tenant. *Test en E2 (RN-04).*

---

## 7. Sub-planes recomendados (uno por subsistema)

Este maestro fija el orden y los criterios; cada etapa se ejecuta con un plan propio a nivel atómico (mismo formato que E1):

1. `2026-10-12-aicorelink-E1-landing-v2-plan.md` — **empezar ya** (E1 de esta hoja).
2. `…-E2-fabrica-sitios-plan.md` — multi-tenant, plantillas, generador, publicación.
3. `…-E3-mensajeria-ia-plan.md` — n8n, base de conocimiento, guardarraíles, módulos por plan.
4. `…-E4-panel-uso-facturacion-plan.md` — metering, panel cliente, reportes, billing.
5. `…-E7-v1.1-paridad-plan.md`, `…-E8-v1.2-diferenciacion-plan.md`, `…-E9-v1.3-escala-plan.md`.

**Por qué sub-planes y no uno solo:** E2–E9 son subsistemas independientes (fábrica, mensajería, facturación); un único documento sería un transcript, no un plan. Cada sub-plan produce software testeable por sí mismo.

---

## 8. Secuencia inmediata (critical path)

```
E1.0 copy/precios ─┬─ E1.1 calculadora ─┐
                   ├─ E1.5 UTM/consent ─┼─ E1.7 analítica ─ E1.9 QA+deploy
                   └─ E1.3/1.4 demos ───┘
E1.2 test de atención (independiente)
E1.6 legales · E1.8 footer/número (independientes)
```

Bloquea todo: **E1.0** (copy/precios) — el resto de E1 depende de la fuente de verdad del copy.

---

## 9. Criterio de "terminado" por etapa (resumen)

| Etapa | Criterio de salida verificable |
|---|---|
| E1 | Cada CTA genera lead con UTM+consent, notificado; demos con rate limit; embudo medible; LH móvil ≥ 90 real en VPS |
| E2 | Sitio de cliente publicable ≤ 10 min con checklist; aislamiento de tenant probado |
| E3 | Tenant nuevo se activa solo cambiando parámetros; chat ≥ 90%; adversarias en verde |
| E4 | Uso/costo medidos por tenant con alertas; reporte mensual correcto; facturación end-to-end |
| E5 | Costo variable por plan validado con datos reales; ≥ 3 testimonios + 2 casos con cifras |
| E6 | Embudo medido con costo/conversión por canal; backlog v1.1 priorizado |
| E7–E9 | Según criterios de salida del Plan v2.0 (Fases 6–8) |
