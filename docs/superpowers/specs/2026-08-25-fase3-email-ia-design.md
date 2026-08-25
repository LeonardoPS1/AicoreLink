# Fase 3 — Email con IA — Design Spec

**Fecha**: 2026-08-25  
**Estado**: Aprobado para implementación  
**Proyecto**: AicoreLink

---

## 1. Resumen Ejecutivo

Implementar canal **Email con IA**: conexión Gmail vía OAuth, polling cada 5 min vía n8n Schedule trigger, clasificación de correos entrantes (consulta|reclamo|agendamiento|spam), respuesta automática por categoría con threshold de confianza 0.7, y UI cliente para conectar cuenta + bandeja con approve/edit/send.

---

## 2. Arquitectura General

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐     ┌────────────────┐
│ Gmail       │     │ n8n Schedule        │     │ IA Classifier │     │ PostgreSQL     │
│ (OAuth +    │────▶│ Trigger (5 min)     │────▶│ (ai/router.ts) │────▶│ (EmailThread,  │
│ IMAP/PubSub)│     │                     │     │               │     │ EmailMessage)  │
└─────────────┘     └─────────────────────┘     └──────┬───────┘     └───────┬────────┘
                                                       │                 │
                                                       ▼                 ▼
                                              ┌──────────────┐     ┌────────────────┐
                                              │ Gmail API    │     │ tenant_usage   │
                                              │ (send/reply) │     │ (metrics)      │
                                              └──────────────┘     └────────────────┘
```

**Decisiones clave**:
- **Conexión**: Gmail OAuth 2.0 (offline access + refresh token). No IMAP directo.
- **Polling**: n8n Schedule trigger cada 5 min → HTTP Request a Gmail API `users.messages.list` (q: `is:unread`) → procesar.
- **Clasificador**: Reutiliza `lib/ai/router.ts` (Fase 1) con prompt adaptado para email.
- **Respuesta**: Auto-reply si `confidence >= 0.7` Y categoría tiene `auto_reply_enabled`. Si `confidence < 0.7` → estado `pending_review` en UI.
- **Multi-tenant**: `channel_credentials` con `provider = 'gmail_oauth'`, `external_id = gmail_user_id` → `tenant_id`.

---

## 3. Modelos de Datos (Prisma)

### Nuevos modelos (migración Fase 3)

```prisma
model EmailThread {
  id             String   @id @default(uuid())
  tenantId       String   @map("tenant_id")
  gmailThreadId  String   @unique @map("gmail_thread_id")
  subject        String
  contactEmail   String   @map("contact_email")
  status         String   @default("abierta")   // abierta | pending_review | escalada | cerrada
  category       String?  // consulta | reclamo | agendamiento | spam
  confidence     Float?   // confidence score del clasificador
  lastMessageAt  DateTime @map("last_message_at")
  createdAt      DateTime @default(now()) @map("created_at")

  messages EmailMessage[]

  @@map("email_threads")
}

model EmailMessage {
  id          String   @id @default(uuid())
  threadId    String   @map("thread_id")
  tenantId    String   @map("tenant_id")
  gmailMsgId  String   @unique @map("gmail_msg_id")
  direction   String   // in | out
  fromEmail   String   @map("from_email")
  toEmail     String   @map("to_email")
  subject     String
  bodyText    String?  @map("body_text")
  bodyHtml    String?  @map("body_html")
  aiGenerated Boolean  @default(false) @map("ai_generated")
  tokensUsed  Int?     @map("tokens_used")
  createdAt   DateTime @default(now()) @map("created_at")

  thread EmailThread @relation(fields: [threadId], references: [id])

  @@map("email_messages")
}
```

**RLS**: Mismo patrón Fase 0/1 — `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` con `current_setting('app.current_tenant')`.

### Extensión `ChannelCredential` (existente)
```prisma
model ChannelCredential {
  // ... campos existentes
  // Para Gmail:
  // provider = 'gmail_oauth'
  // externalId = gmail_user_id (ej. 'user@gmail.com')
  // encryptedSecret = refresh_token (encriptado)
  // config = Json? { accessToken, expiresAt, scopes[] }
}
```

---

## 4. Componentes Backend

### 4.1 `lib/email/gmail-client.ts`
```ts
interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
}

export async function getGmailClient(tenantId: string): Promise<gmail_v1.Gmail> {
  const cred = await getChannelCredential(tenantId, 'gmail_oauth');
  const tokens = decryptTokens(cred.encryptedSecret, cred.config);
  if (Date.now() > tokens.expiresAt - 60000) {
    tokens = await refreshAccessToken(tokens.refreshToken);
    await updateChannelCredentialConfig(tenantId, 'gmail_oauth', tokens);
  }
  return google.gmail({ version: 'v1', auth: new OAuth2Client(tokens.accessToken) });
}

export async function listUnreadMessages(gmail: gmail_v1.Gmail, maxResults = 50): Promise<Message[]>
export async function getMessage(gmail: gmail_v1.Gmail, msgId: string): Promise<Message>
export async function sendReply(gmail: gmail_v1.Gmail, threadId: string, to: string, subject: string, body: string): Promise<void>
export async function modifyMessage(gmail: gmail_v1.Gmail, msgId: string, addLabels: string[], removeLabels: string[]): Promise<void>
```

### 4.2 `lib/email/classifier.ts` (extiende `lib/ai/router.ts`)
```ts
type EmailCategory = 'consulta' | 'reclamo' | 'agendamiento' | 'spam';

interface ClassificationResult {
  category: EmailCategory;
  confidence: number;
  reasoning: string;
  suggestedReply?: string;  // si confidence >= 0.7 y auto_reply_enabled
}

export async function classifyEmail(
  subject: string,
  body: string,
  history: EmailMessage[],
  config: TenantEmailConfig
): Promise<ClassificationResult> {
  // Usa router.ts con prompt específico para email
  // Retorna category + confidence + suggestedReply (si aplica)
}
```

### 4.3 `lib/email/config.ts`
```ts
interface TenantEmailConfig {
  // General
  autoReplyEnabled: boolean;
  businessHours: string;
  signature: string;
  // Por categoría
  categories: {
    consulta: { autoReply: boolean; template?: string };
    reclamo: { autoReply: boolean; template?: string; escalate: boolean };
    agendamiento: { autoReply: boolean; template?: string };
    spam: { autoReply: false; escalate: false };
  };
  // Escalado
  escalationKeywords: string[];
  escalationNotify: 'email' | 'telegram' | 'none';
  confidenceThreshold: number; // default 0.7
}
```

### 4.4 `api/email/oauth/route.ts`
- **GET `/api/email/oauth`**: Inicia flujo OAuth → redirect a Google consent screen
- **GET `/api/email/oauth/callback`**: Recibe `code` → exchange por tokens → guarda en `ChannelCredential` (encrypt refresh_token) → redirect a `/email` con success

### 4.5 `api/email/webhook/route.ts` (opcional: Pub/Sub push)
- Para futuro: Gmail Pub/Sub push notifications en lugar de polling
- **POST**: Validar `message` → extraer `historyId` → trigger n8n workflow

---

## 5. n8n Workflow (`n8n-workflows/email-ia.json`)

**Trigger**: **Schedule Trigger** (Every 5 minutes)

**Nodos principales**:
1. **Schedule Trigger** (cada 5 min)
2. **Loop Over Tenants**: Obtener tenants con feature `email_ia` activa + credencial Gmail válida
3. **HTTP Request → Gmail API**: `users.messages.list` (q: `is:unread`, maxResults: 50)
4. **Split In Batches**: Procesar mensaje por mensaje
5. **HTTP Request → Gmail API**: `users.messages.get` (full message)
6. **Postgres**: Buscar/crear `EmailThread` por `gmailThreadId`
7. **Postgres**: Insert `EmailMessage` entrante
8. **Function Node**: Construir prompt + llamar `classifyEmail` (via HTTP a endpoint interno o código inline)
9. **IF Node**: `confidence >= config.confidenceThreshold` AND `category.autoReply === true`
   - **True**: HTTP Request → Gmail API `sendReply` + Insert `EmailMessage` saliente + `tenant_usage` update
   - **False**: Update `EmailThread.status = 'pending_review'` + `category` + `confidence`
10. **IF Node**: Escalado (keywords OR category `reclamo` con `escalate: true` OR `confidence < threshold`)
    - **True**: Update `EmailThread.status = 'escalada'` + notificar (email/Telegram)
11. **HTTP Request → Gmail API**: `users.messages.modify` (add `UNREAD` removal, add custom label `AICORELINK_PROCESSED`)

**Variables n8n**: `$env.AICORELINK_GOOGLE_CLIENT_ID`, `$env.AICORELINK_GOOGLE_CLIENT_SECRET`, `$env.AICORELINK_DATABASE_URL`, `$env.AICORELINK_ENCRYPTION_KEY`

---

## 6. Frontend — Panel Cliente

### 6.1 `(cliente)/email/page.tsx`
- **Estado conexión**: Badge "Conectado" / "No conectado" + botón "Conectar Gmail" (inicia OAuth)
- **Configuración** (tabs):
  - **General**: businessHours, signature, autoReplyEnabled (master toggle)
  - **Categorías**: Para cada categoría (consulta|reclamo|agendamiento|spam): autoReply toggle, template textarea, escalate toggle (solo reclamo)
  - **Escalado**: escalationKeywords (array), escalationNotify (select), confidenceThreshold (number 0-1, default 0.7)
- Guardado via `setFeature(tenantId, 'email_ia', true, actorId)` + update `tenant_channels.config` JSONB

### 6.2 `(cliente)/email/bandeja/page.tsx`
- Lista paginada de `EmailThread` (filtros: abierta | pending_review | escalada | cerrada)
- Columnas: Asunto, Remitente, Categoría (badge color), Confianza, Estado, Último mensaje
- Click → drawer/detalle con:
  - Historial completo `EmailMessage` (in/out, aiGenerated badge)
  - Si `status = 'pending_review'`: botones **Aprobar y Enviar** / **Editar y Enviar** / **Marcar Spam** / **Escalar**
  - Editor de respuesta con prefill de `suggestedReply`
  - Al enviar: llama API interno → Gmail API → actualiza thread + messages + usage

---

## 7. Variables de Entorno Nuevas

```env
# Google OAuth
AICORELINK_GOOGLE_CLIENT_ID=
AICORELINK_GOOGLE_CLIENT_SECRET=
AICORELINK_GOOGLE_REDIRECT_URI=https://AicoreLink.aicorebots.com/api/email/oauth/callback

# IA (ya existen de Fase 1)
AICORELINK_OPENROUTER_API_KEY=
AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434

# Encriptación (ya existe)
AICORELINK_ENCRYPTION_KEY=
```

---

## 8. Criterios de Aceptación

1. ✅ OAuth Gmail: Usuario conecta cuenta → tokens guardados encriptados → refresh automático
2. ✅ Polling 5 min: n8n detecta emails no leídos → clasifica → procesa
3. ✅ Clasificación correcta: 4 categorías con confidence score
4. ✅ Auto-reply: `confidence >= 0.7` + `autoReply: true` → envía respuesta automática
5. ✅ Pending review: `confidence < 0.7` → visible en bandeja con botones approve/edit
6. ✅ Escalado: keywords + categoría reclamo + baja confianza → `status = 'escalada'` + notificación
7. ✅ Métricas: `tenant_usage` actualizado (emails_in/out, tokens, cost_estimate)
8. ✅ Aislamiento multi-tenant: RLS en `email_threads` + `email_messages` verificado

---

## 9. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Gmail API quota (250/unidad/usuario/seg) | Batch requests, maxResults=50, exponential backoff |
| Refresh token expira (7 días sin uso) | Requiere reconexión OAuth; alerta en UI si `expiresAt` cercano |
| Clasificación errónea spam | Categoría `spam` nunca auto-reply; siempre manual |
| Costo OpenRouter | `confidenceThreshold` + `maxTokens` config + cost_rates tracking |
| Multi-tenant leak | RLS + test automatizado cross-tenant |

---

## 10. Próximos Pasos

1. Escribir **Implementation Plan** (invocar `writing-plans` skill)
2. Crear migración Prisma + RLS para `EmailThread` + `EmailMessage`
3. Implementar `lib/email/gmail-client.ts` + OAuth flow
4. Extender `lib/ai/router.ts` con `classifyEmail`
5. Crear workflow n8n `email-ia.json`
6. Implementar frontend: `/email` (OAuth + config) + `/email/bandeja`
7. Testing end-to-end con cuenta Gmail de prueba
8. Deploy Dokploy + configurar variables