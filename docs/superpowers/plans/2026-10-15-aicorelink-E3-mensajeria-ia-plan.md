# E3 — Mensajería, IA y guardarraíles: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada tenant atienda de verdad por WhatsApp (vía Chatwoot), con IA acotada a su base de conocimiento, guardarraíles, cuotas por plan y derivación a humano. Criterio de salida: tenant nuevo se activa cambiando sólo parámetros; calidad del chat ≥ 90%; pruebas adversarias en verde.

**Architecture:** Ingesta por webhook firmado de Chatwoot → espejo idempotente en Postgres (RLS) → guardarraíles de entrada/salida → enrutamiento de modelo → respuesta por API de Chatwoot. n8n orquesta y agenda; AicoreLink es dueño de la lógica vía `/api/internal/*`. KB en filas estructuradas. Un número dedicado por tenant. Voz (Elite) en E3.7.

**Tech Stack:** Next.js 14 Route Handlers · Prisma · PostgreSQL (RLS) · NextAuth · n8n (JSON versionado) · Ollama (Mistral) · OpenRouter (GLM) · Chatwoot API · vitest + RTL · Playwright.

**Spec:** `docs/superpowers/specs/2026-10-15-aicorelink-E3-mensajeria-ia-design.md` (aprobado 2026-10-27).

## Global Constraints

- Copy en español chileno (tuteo), nunca voseo. Código, identificadores y commits en inglés.
- Commits convencionales, sin atribución AI.
- Multi-tenant: PostgreSQL compartida, `tenant_id` + RLS. Toda query del cliente dentro de `withTenant()` / `asAdmin()`.
- ENV canónicos sin prefijo (`DATABASE_URL`, `NEXTAUTH_SECRET`, …), con fallback prefijado vía `lib/env.ts`.
- Agregar tenant = operación de DATOS, nunca código.
- Gates obligatorios por etapa: `lint`, `build`, `typecheck`, `vitest`, E2E local.
- Trampa Windows: matar el server del :3111 antes de `npm run build`; correr `typecheck` después del build.

## Review Focus

- Firma del webhook de Chatwoot: timestamp fuera de ventana (replay) y body re-leído (raw body consumido dos veces) → 401.
- Idempotencia del espejo: el mismo `message_id` de Chatwoot llegando dos veces no duplica fila ni suma uso.
- RLS: un mensaje de un tenant nunca se espeja ni se lee bajo el contexto de otro.
- Guardarraíles: inyección en el contenido del cliente final no puede modificar reglas del sistema; cifras inventadas se borran.
- Cuota agotada: el asistente deriva, nunca se calla en silencio.
- Chat público de la landing (tests existentes) sigue verde tras generalizar `lib/demos`.

---

## File Structure (nuevos / modificados)

```
apps/dashboard/
├── app/api/webhooks/chatwoot/route.ts          (nuevo)   ingesta + firma + espejo + respuesta
├── app/api/webhooks/whatsapp/route.ts           (mod)     retiro del camino prod (flag)
├── app/api/webhooks/n8n/route.ts                (mod)     fix firma (raw body + timingSafeEqual)
├── app/api/internal/health/route.ts             (existe)  patrón de internal key
├── app/api/internal/messages/route.ts           (nuevo)   espejo/lectura para n8n
├── app/api/internal/usage/route.ts              (nuevo)   cuotas/uso para n8n
├── lib/chatwoot/                                (nuevo)   client + firma + tipos
│   ├── client.ts, signature.ts, types.ts
├── lib/conversations/                           (nuevo)   identidad única + espejo
│   ├── identity.ts, mirror.ts
├── lib/knowledge/                               (nuevo)   KB por tenant (generaliza lib/demos)
│   ├── schema.ts, repository.ts, guardrails.ts, prompt.ts
├── lib/ai/router.ts                             (mod)     política por plan + costo
├── lib/ai/ollama-client.ts                      (mod)     prompt por rubro/tenant (quita clínico)
├── lib/whatsapp/config.ts                       (mod)     persistencia + merge con KB
├── lib/whatsapp/resolve-tenant.ts               (mod)     ruteo por inbox de Chatwoot
├── prisma/schema.prisma                         (mod)     KB, uso por período, modelo/versión
├── prisma/migrations/...                        (nuevo)   migraciones
├── lib/panel/plans.ts                           (existe)  cuotas §3.2
├── tests/...                                    (nuevo)   por módulo
n8n/workflows/                                   (nuevo)   6 flujos JSON versionados
```

---

## E3.1 — Ingesta e identidad de conversación

### Task 1: Firma del webhook de Chatwoot

**Files:**
- Create: `apps/dashboard/lib/chatwoot/signature.ts`
- Create: `apps/dashboard/lib/chatwoot/types.ts`
- Test: `apps/dashboard/__tests__/chatwoot-signature.test.ts`

**Interfaces:**
- Produces: `verifyChatwootSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean` (ventana 5 min), `parseChatwootWebhook(rawBody: string): ChatwootWebhookPayload`.

- [ ] **Step 1: Write failing test** — firma válida pasa; timestamp fuera de ventana falla; firma con longitud distinta no tira; firma inválida falla.
- [ ] **Step 2: Run test** → Expected: FAIL.
- [ ] **Step 3: Implement** — HMAC-SHA256 de `{timestamp}.{rawBody}` comparado con `timingSafeEqual` (normalizando longitud), ventana 5 min. Tipos del payload (`message_created`, inbox, conversation, sender, message).
- [ ] **Step 4: Run test** → Expected: PASS.
- [ ] **Step 5: Commit** `feat(chatwoot): signed webhook verification helper`.

### Task 2: Resolver tenant por inbox de Chatwoot

**Files:**
- Modify: `apps/dashboard/lib/whatsapp/resolve-tenant.ts`
- Test: `apps/dashboard/__tests__/resolve-tenant-chatwoot.test.ts`

**Interfaces:**
- Consumes: `channel_credentials` (provider `chatwoot`, externalId = inbox id).
- Produces: `resolveTenantByChatwootInbox(inboxId: string): Promise<{ tenantId, channelId } | null>`.

- [ ] **Step 1: Write failing test** — inbox existente resuelve tenant; inexistente → null; RLS no filtra (usa asAdmin para lookup).
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — lookup por `provider='chatwoot'`, `externalId=inboxId`, `enabled=true`.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Commit** `feat(chatwoot): resolve tenant by inbox`.

### Task 3: Identidad única de conversación

**Files:**
- Create: `apps/dashboard/lib/conversations/identity.ts`
- Test: `apps/dashboard/__tests__/conversation-identity.test.ts`

**Interfaces:**
- Produces: `conversationKey(tenantId, chatwootConversationId): string` (determinístico, `cw_${tenantId}_${id}`); `findOrCreateConversation(tx, tenantId, key, contactRef)`.

- [ ] **Step 1: Write failing test** — misma key dos veces → misma fila; keys distintas → filas distintas; idempotente.
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — upsert por `(tenant_id, external_id)` único.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Commit** `feat(conversations): single identity per contact`.

### Task 4: Espejo idempotente de mensaje

**Files:**
- Create: `apps/dashboard/lib/conversations/mirror.ts`
- Test: `apps/dashboard/__tests__/mirror-idempotency.test.ts`

**Interfaces:**
- Produces: `mirrorMessage(tx, { tenantId, conversationKey, chatwootMessageId, direction, content, audioUrl?, senderRef })` → `{ created: boolean }`.

- [ ] **Step 1: Write failing test** — mismo `chatwootMessageId` dos veces → `created=false` la segunda, sin fila duplicada, sin suma de uso duplicada.
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — unique `(tenant_id, external_message_id)`; on conflict return `{ created: false }`.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Commit** `feat(conversations): idempotent message mirror`.

### Task 5: Route handler de ingesta `/api/webhooks/chatwoot`

**Files:**
- Create: `apps/dashboard/app/api/webhooks/chatwoot/route.ts`
- Test: `apps/dashboard/__tests__/webhook-chatwoot.test.ts`

**Interfaces:**
- Consumes: signature (Task 1), resolve tenant (Task 2), identity (Task 3), mirror (Task 4).
- Produce respuesta por API de Chatwoot (`lib/chatwoot/client.ts`).

- [ ] **Step 1: Write failing test** — firma inválida → 401; evento no `message_created` → 200 (ignorado); mensaje válido → espeja + responde; replay del mismo id → no duplica.
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — leer raw body una sola vez; verificar firma; resolver tenant; espejar; evaluar derivación/cuota; guardarraíles; generar; responder por Chatwoot API; registrar uso.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Commit** `feat(chatwoot): ingestion route with signed webhook`.

### Task 6: Client de Chatwoot API

**Files:**
- Create: `apps/dashboard/lib/chatwoot/client.ts`
- Test: `apps/dashboard/__tests__/chatwoot-client.test.ts`

**Interfaces:**
- Produces: `sendChatwootMessage({ accountId, conversationId, content, accessToken })`, `getChatwootInbox(...)`.

- [ ] Steps TDD estándar. Commit `feat(chatwoot): api client`.

### Task 7: Corregir los 8 defectos de §3.2

**Files:**
- Modify: `apps/dashboard/app/api/webhooks/whatsapp/route.ts` (retirar del camino prod, flag `WHATSAPP_DIRECT_ENABLED`)
- Modify: `apps/dashboard/app/api/webhooks/n8n/route.ts` (fix firma: raw body + timingSafeEqual lengths)
- Modify: `apps/dashboard/lib/ai/ollama-client.ts` (quitar prompt clínico → placeholder por rubro, se completa en E3.2)
- Modify: `apps/dashboard/lib/whatsapp/config.ts` (persistencia de KB, se completa en E3.2)

**Interfaces:**
- Defecto 4: firma n8n lee raw body y compara longitudes seguras.
- Defecto 5: `audio_url` en vez de `audioId`.
- Defecto 7: prompt genérico (sin «paciente»/«clinica medica»).

- [ ] **Step 1: Write failing tests** para firma n8n (raw body, lengths) y audio_url.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** los fixes.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `fix(webhooks): n8n signature, audio_url column, remove clinic prompt`.

---

## E3.2 — KB y guardarraíles por tenant

### Task 8: Schema de KB estructurada

**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma` (model `KnowledgeBase` con category, question, answer, tenant)
- Create migration.

- [ ] Steps TDD. Commit `feat(kb): structured knowledge base model`.

### Task 9: Generalizar `lib/demos/knowledge.ts` a por-tenant

**Files:**
- Create: `apps/dashboard/lib/knowledge/guardrails.ts` (mover `isInjection`, `applyGuardrails`)
- Create: `apps/dashboard/lib/knowledge/repository.ts`
- Modify: `apps/dashboard/lib/demos/knowledge.ts` (consumidor)
- Test: `apps/dashboard/__tests__/kb-guardrails.test.ts`

- [ ] **Step 1: Write failing tests** — 50 preguntas fuera de base ⇒ ≥ 95% «no tengo ese dato» + derivación; inyección no pasa ninguna regla; chat público de landing sigue verde.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — generalizar; mantener tests del chat público en verde.
- [ ] **Step 4: Run** → PASS (incluye tests del chat público).
- [ ] **Step 5: Commit** `refactor(kb): generalize demos guardrails to per-tenant`.

### Task 10: Prompt por rubro/tenant

**Files:**
- Create: `apps/dashboard/lib/knowledge/prompt.ts`
- Modify: `apps/dashboard/lib/ai/ollama-client.ts`
- Test: `apps/dashboard/__tests__/kb-prompt.test.ts`

- [ ] Steps TDD. Commit `feat(kb): per-tenant prompt builder (Chilean tuteo)`.

### Task 11: Temas prohibidos + tono de marca

**Files:**
- Modify: KB schema + repository (forbidden topics, tone).
- Test: `apps/dashboard/__tests__/kb-forbidden.test.ts`

- [ ] Steps TDD. Commit `feat(kb): configurable forbidden topics and brand tone`.

---

## E3.3 — Enrutamiento, uso y cuotas

### Task 12: Política de modelo por plan

**Files:**
- Modify: `apps/dashboard/lib/ai/router.ts`
- Test: `apps/dashboard/__tests__/ai-router-plan.test.ts`

- [ ] Steps TDD. Commit `feat(ai): model routing by plan (local vs cloud)`.

### Task 13: Registro de uso y costo por conversación

**Files:**
- Modify: `prisma/schema.prisma` (`TenantUsage` por período, `CostRate`)
- Create migration.
- Modify: ingestion route (registrar tokens/costo/modelo).
- Test: `apps/dashboard/__tests__/usage-tracking.test.ts`

- [ ] Steps TDD. Commit `feat(usage): per-conversation usage and cost tracking`.

### Task 14: Cuotas con avisos 80%/100% y derivación al agotar

**Files:**
- Modify: `apps/dashboard/lib/panel/plans.ts` (cuotas §3.2 ya existen; consumir)
- Modify: ingestion route.
- Test: `apps/dashboard/__tests__/quota-enforcement.test.ts`

- [ ] Steps TDD (aviso 80/100; al agotar deriva, no se calla). Commit `feat(quota): 80/100 alerts and handoff on exhaustion`.

---

## E3.4 — Derivación con resumen + modo aprendizaje

### Task 15: Estados del hilo + derivación

**Files:**
- Modify: `prisma/schema.prisma` (estado del hilo: open/escalated/closed)
- Modify: ingestion route + guardrails.
- Test: `apps/dashboard/__tests__/escalation.test.ts`

- [ ] Steps TDD. Commit `feat(escalation): thread state, summary, handoff`.

### Task 16: Modo aprendizaje (pregunta al dueño → respuesta aprobada → KB)

**Files:**
- Create: `apps/dashboard/lib/knowledge/learning.ts`
- Test: `apps/dashboard/__tests__/learning-mode.test.ts`

- [ ] Steps TDD. Commit `feat(learning): unanswered question → approved answer → KB`.

---

## E3.5 — Flujos n8n versionados

### Task 17: 6 flujos JSON en el repo

**Files:**
- Create: `n8n/workflows/{lead,respuesta,reserva,recordatorio,resena,reporte}.json`
- Create: `n8n/README.md` (importación documentada)
- Test: `apps/dashboard/__tests__/n8n-webhook-signature.test.ts` (firma válida/in válida)

- [ ] Steps TDD (firma válida dispara; inválida 401). Commit `feat(n8n): versioned workflows + internal api calls`.

### Task 18: Endpoints `/api/internal/*` para n8n

**Files:**
- Create: `apps/dashboard/app/api/internal/messages/route.ts`
- Create: `apps/dashboard/app/api/internal/usage/route.ts`
- Test: `apps/dashboard/__tests__/internal-api.test.ts`

- [ ] Steps TDD (auth por `FACTORY_INTERNAL_API_KEY`). Commit `feat(internal): messages and usage endpoints for n8n`.

---

## E3.6 — Calidad y transparencia

### Task 19: Registro de modelo/versión + tiempo a primera respuesta

**Files:**
- Modify: ingestion route + schema (model, version, firstResponseMs).
- Test: `apps/dashboard/__tests__/first-response-metric.test.ts`

- [ ] Steps TDD. Commit `feat(quality): model/version log and first-response time`.

### Task 20: Suite adversaria de IA

**Files:**
- Create: `apps/dashboard/__tests__/adversarial-ai.test.ts`

- [ ] Steps TDD (inyección, temas prohibidos, cifras inventadas). Commit `test(adversarial): ai guardrail suite`.

---

## E3.7 — Voz (Elite)

### Task 21: Recepcionista de voz

**Files:**
- Modify: `apps/dashboard/lib/voice/{stt,tts}.ts` (integración con KB + guardrails)
- Create: `apps/dashboard/lib/voice/receptionist.ts`
- Test: `apps/dashboard/__tests__/voice-receptionist.test.ts`

- [ ] Steps TDD (aviso de IA y grabación; ≤ 1,5 s por turno; agenda sin intervención). Commit `feat(voice): elite receptionist with guardrails`.

---

## Self-Review

1. **Spec coverage:** E3.1–E3.7 cubiertos; RF-MSG-01..04, RF-KB-01..07, RF-QLT-01/04/06, SRD §3.2. Fuera de E3 (RF-MSG-05/06/07, RF-MSX, voz Elite ya en E3.7) respetados.
2. **Step scan:** cada task tiene test + implementación + commit; bodies delegados al implementer vía signature.
3. **Type consistency:** `chatwootMessageId`, `conversationKey`, `tenantId` consistentes; `external_message_id` único por tenant.
4. **Review Focus:** los 6 puntos tienen task/test asignado (firma, idempotencia, RLS, guardarraíles, cuota, chat público).
5. **Proportion:** plan ~tasks con signatures, no código completo.

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-10-15-aicorelink-E3-mensajeria-ia-plan.md`. Por favor revisá el plan. ¿Captura lo que querés? ¿Ejecutamos con subagent-driven (review por task) o native (todo en esta sesión)?
