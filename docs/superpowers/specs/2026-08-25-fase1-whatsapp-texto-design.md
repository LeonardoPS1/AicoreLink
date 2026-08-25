# Fase 1 — WhatsApp Texto (MVP Vendible) — Design Spec

**Fecha**: 2026-08-25  
**Estado**: Aprobado para implementación  
**Proyecto**: AicoreLink

---

## 1. Resumen Ejecutivo

Implementar el primer canal real y facturable: **WhatsApp Texto**. Un mensaje entrante de un paciente debe llegar al webhook de Meta, resolverse al tenant correcto vía `phone_number_id`, verificar feature flag `whatsapp_text`, generar respuesta con IA (router Ollama → OpenRouter), enviarse de vuelta por Meta Cloud API, y quedar registrado en métricas (`tenant_usage`).

---

## 2. Arquitectura General

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐     ┌────────────────┐
│ Meta        │────▶│ Next.js Route       │────▶│ n8n Workflow │────▶│ IA (Ollama/    │
│ WhatsApp    │     │ Handler             │     │ (orquestación)│     │ OpenRouter)    │
│ Webhook     │     │ (validación ligera) │     │              │     │                │
└─────────────┘     └─────────────────────┘     └──────┬───────┘     └───────┬────────┘
                                                       │                 │
                                                       ▼                 ▼
                                              ┌──────────────┐     ┌────────────────┐
                                              │ Meta Cloud   │     │ PostgreSQL     │
                                              │ API (send)   │     │ (conversations,│
                                              └──────────────┘     │ messages,     │
                                                                    │ tenant_usage)  │
                                                                    └────────────────┘
```

**Decisiones clave**:
- Route handler Next.js: validación webhook Meta + resolve tenant → dispara n8n webhook → responde 200 inmediato
- n8n: orquestación visible, debug, reintentos; llamadas a IA via HTTP Request directos (performance)
- Router IA: Clasificador Ollama local gratis → decide simple (Ollama) vs compleja (OpenRouter)

---

## 3. Modelos de Datos (Prisma)

### Nuevos modelos (migración Fase 1)

```prisma
model Conversation {
  id         String   @id @default(uuid())
  tenantId   String   @map("tenant_id")
  channel    String   @default("whatsapp_text")
  contactRef String   @map("contact_ref")   // teléfono del paciente
  status     String   @default("abierta")   // abierta | escalada | cerrada
  escalado   Boolean  @default(false)
  createdAt  DateTime @default(now()) @map("created_at")

  messages Message[]

  @@map("conversations")
}

model Message {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  tenantId       String   @map("tenant_id")
  direction      String   // in | out
  content        String
  aiGenerated    Boolean  @default(false) @map("ai_generated")
  tokensUsed     Int?     @map("tokens_used")
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@map("messages")
}
```

**RLS**: Mismo patrón que Fase 0 — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` usando `current_setting('app.current_tenant')`.

---

## 4. Componentes Backend

### 4.1 `api/webhooks/whatsapp/route.ts`
- **GET**: Verificación Meta (`hub.challenge` + `AICORELINK_META_VERIFY_TOKEN`)
- **POST**: 
  1. Validar firma `X-Hub-Signature-256` (HMAC SHA256 con `AICORELINK_META_APP_SECRET`)
  2. Extraer `phone_number_id` y mensaje entrante
  3. `resolveTenant(phone_number_id)` → `tenantId` o null
  4. Si no hay tenant → responder 200 sin procesar (nunca error a Meta)
  5. `hasFeature(tenantId, 'whatsapp_text')` → si false → 200 sin respuesta
  6. Disparar n8n webhook con payload: `{ tenantId, phoneNumberId, contactRef, message, timestamp }`
  7. Responder 200 OK a Meta

### 4.2 `lib/whatsapp/resolve-tenant.ts`
```ts
export async function resolveTenantByPhoneNumberId(
  phoneNumberId: string
): Promise<string | null> {
  return asAdmin((tx) =>
    tx.channelCredential.findFirst({
      where: { provider: 'meta_cloud_api', externalId: phoneNumberId },
      select: { tenantId: true },
    }).then((c) => c?.tenantId ?? null)
  );
}
```
*Usa `asAdmin` porque `channel_credentials` tiene RLS y el webhook corre sin contexto de tenant.*

### 4.3 `lib/ai/router.ts`
```ts
type Intent = 'simple' | 'agendamiento' | 'reclamo' | 'otro';

export async function classifyIntent(
  message: string,
  history: Message[],
  config: TenantWhatsAppConfig
): Promise<{ intent: Intent; confidence: number; useOpenRouter: boolean }> {
  // 1. Llamada a Ollama/Gemma3 con prompt de clasificación
  // 2. Si confidence > 0.8 y intent === 'simple' → useOpenRouter = false
  // 3. Sino → useOpenRouter = true
}
```

### 4.4 `lib/ai/ollama-client.ts` / `openrouter-client.ts`
- Clientes HTTP tipados con timeout, retry, error handling
- Ollama: `AICORELINK_OLLAMA_BASE_URL` (default `http://172.18.0.1:11434`)
- OpenRouter: `AICORELINK_OPENROUTER_API_KEY`, modelo configurable (default GLM 4.5)

### 4.5 `lib/whatsapp/meta-client.ts`
```ts
export async function sendWhatsAppText(
  phoneNumberId: string,
  to: string,
  text: string,
  accessToken: string
): Promise<MetaSendResponse>
```
- Usa `channel_credentials.encryptedSecret` (desencriptar con `AICORELINK_ENCRYPTION_KEY`)

### 4.6 `lib/whatsapp/config.ts`
```ts
interface TenantWhatsAppConfig {
  // General
  tone: 'formal' | 'amable' | 'empatico';
  businessHours: string; // "09:00-18:00"
  knowledgeBase: string;
  autoReplyEnabled: boolean;
  // IA
  preferLocalAi: boolean;
  maxTokensResponse: number;
  // Escalado
  escalationKeywords: string[];
  escalationNotify: 'email' | 'telegram' | 'none';
  escalationMessage: string;
}
```

---

## 5. n8n Workflow (`n8n-workflows/whatsapp-text.json`)

**Nodos principales**:
1. **Webhook Trigger** (recibe payload del route handler)
2. **Postgres Node**: `SET LOCAL app.current_tenant = $tenantId` + buscar/crear `Conversation`
3. **Postgres Node**: Insert `Message` entrante
4. **HTTP Request → Ollama**: Clasificar intención (prompt estructurado, output JSON)
5. **IF Node**: `intent === 'simple' && confidence > 0.8`
   - **True branch**: HTTP Request → Ollama (generar respuesta)
   - **False branch**: HTTP Request → OpenRouter (generar respuesta)
6. **IF Node**: Verificar escalado (keywords en mensaje OR `escalate: true` en respuesta IA)
   - **True**: Update `Conversation.escalado = true` + notificar (email/Telegram si configurado)
7. **HTTP Request → Meta Cloud API**: Enviar respuesta
8. **Postgres Node**: Insert `Message` saliente + actualizar `tenant_usage` (messages in/out, tokens, cost_estimate)

**Variables de entorno n8n**: `$env.AICORELINK_OLLAMA_BASE_URL`, `$env.AICORELINK_OPENROUTER_API_KEY`, `$env.AICORELINK_META_CLOUD_API_TOKEN`, `$env.AICORELINK_DATABASE_URL`

---

## 6. Frontend — Panel Cliente

### 6.1 `(cliente)/whatsapp/page.tsx`
- **Toggle visual** (solo lectura del estado real; activación real via admin/billing)
- **Tabs de configuración**:
  - **General**: tone, businessHours, knowledgeBase (textarea), autoReplyEnabled
  - **IA**: preferLocalAi, maxTokensResponse
  - **Escalado**: escalationKeywords (array input), escalationNotify (select), escalationMessage
- Guardado via `setFeature(tenantId, 'whatsapp_text', true, actorId)` + update `config` JSONB

### 6.2 `(cliente)/whatsapp/conversaciones/page.tsx`
- Lista paginada de `Conversation` (filtro: abierta/escalada/cerrada)
- Click → detalle con historial de `Message` (in/out, aiGenerated badge, timestamp)
- Badge "Escalada" visible si `escalado = true`

### 6.3 Actualizar `(cliente)/dashboard/page.tsx`
- Ya implementado en Fase 5: muestra métricas reales por canal si `whatsapp_text` activo

---

## 7. Variables de Entorno Nuevas

```env
# Meta WhatsApp
AICORELINK_META_CLOUD_API_TOKEN=
AICORELINK_META_VERIFY_TOKEN=
AICORELINK_META_APP_SECRET=
AICORELINK_META_PHONE_NUMBER_ID=      # opcional: solo para modo prueba compartido

# IA
AICORELINK_OPENROUTER_API_KEY=
AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434

# Encriptación (ya existe en Fase 0)
AICORELINK_ENCRYPTION_KEY=
```

---

## 8. Infraestructura (Docker Compose)

```yaml
# Agregar a infra/docker-compose.aicorelink.yml
aicorelink-whatsapp-worker:
  image: aicorelink/whatsapp-worker:latest
  environment:
    - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
    - AICORELINK_META_CLOUD_API_TOKEN=${AICORELINK_META_CLOUD_API_TOKEN}
    - AICORELINK_META_VERIFY_TOKEN=${AICORELINK_META_VERIFY_TOKEN}
    - AICORELINK_OPENROUTER_API_KEY=${AICORELINK_OPENROUTER_API_KEY}
    - AICORELINK_OLLAMA_BASE_URL=${AICORELINK_OLLAMA_BASE_URL}
  deploy:
    replicas: 1
    restart_policy:
      condition: on-failure
  networks:
    - internal
```

*Nota: En Fase 1 el "worker" puede ser el mismo proceso Next.js (route handler) que dispara n8n. Servicio separado solo si volumen lo justifica.*

---

## 9. Criterios de Aceptación

1. ✅ Mensaje real → resuelve tenant correcto → respuesta coherente automática
2. ✅ Desactivar `whatsapp_text` en admin → webhook recibe pero no genera respuesta
3. ✅ `tenant_usage` actualizado: messages_in/out, tokens_used, cost_estimate
4. ✅ Keyword escalado ("humano", "persona", "agente") O IA detecta escalado → `conversation.escalado = true` + badge en panel
5. ✅ Aislamiento: Tenant A no ve conversaciones/mensajes de Tenant B (RLS verificado)

---

## 10. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Webhook Meta timeout (3s) | Route handler responde 200 inmediato, procesa async via n8n |
| Ollama no disponible | Fallback a OpenRouter automático en router |
| Encriptación secrets | `AICORELINK_ENCRYPTION_KEY` rotación documentada |
| Costo OpenRouter descontrolado | `maxTokensResponse` + `cost_rates` tracking en `tenant_usage` |
| Multi-tenant leak | RLS en `conversations` + `messages` + test automatizado |

---

## 11. Próximos Pasos

1. Escribir **Implementation Plan** (invocar `writing-plans` skill)
2. Crear migración Prisma + RLS para `Conversation` + `Message`
3. Implementar componentes backend en orden: resolve-tenant → meta-client → ollama/openrouter clients → router → route handler
4. Crear workflow n8n y exportar JSON
5. Implementar frontend panel cliente (config + conversaciones)
6. Testing end-to-end con número de prueba Meta
7. Deploy Dokploy + configurar variables