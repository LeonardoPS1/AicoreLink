# AicoreLink - Implement All Phases (1-5) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete implementation of all 5 phases of AicoreLink: WhatsApp Texto (Fase 1), WhatsApp Voz (Fase 2), Email IA (Fase 3), RRSS (Fase 4), Métricas Avanzadas (Fase 5) - building on existing Fase 0 foundation.

**Architecture:** Next.js 14 App Router with Prisma ORM, PostgreSQL with RLS, n8n for workflow orchestration, Docker Swarm/Dokploy deployment. Multi-tenant via tenant_id + RLS. Channel processing via n8n workflows triggered by webhooks.

**Tech Stack:** TypeScript, Next.js 14, Prisma, PostgreSQL, n8n, Ollama (Gemma3), OpenRouter (GLM), Whisper ASR, ElevenLabs, Meta Cloud/Graph APIs, Tailwind CSS, Docker.

## Global Constraints

- **Multi-tenancy:** Single PostgreSQL DB, tenant_id column + RLS policies on all data tables. Adding tenant = INSERT rows only, never new code.
- **Env prefix:** `AICORELINK_` for all project env vars.
- **Docker prefix:** `aicorelink-*` for service names.
- **Domain:** `https://aicorelink.aicorebots.com` (lowercase) - NEXTAUTH_URL must match exactly.
- **RLS:** All data tables must have `tenant_id` and policy `USING (tenant_id = current_setting('app.current_tenant', true)::UUID)`.
- **Admin bypass:** Role `aicorelink_admin` with BYPASSRLS for admin panel queries only.
- **Feature flags:** Channel enablement via `tenant_channels.enabled` checked via `hasFeature()` in lib/entitlements.ts.
- **Context setting:** All client-panel queries must use `withTenant(tenantId, fn)` which executes `SET LOCAL app.current_tenant = tenantId`.

---

## File Structure Map (New/Modified Files)

### Phase 1 - WhatsApp Texto (Complete Missing Pieces)
```
apps/dashboard/
├── app/
│   ├── api/
│   │   ├── tenants/
│   │   │   ├── conversations/
│   │   │   │   └── [id]/
│   │   │   │       └── messages/
│   │   │   │           └── route.ts          # NEW: GET messages for conversation
│   │   │   └── channels/
│   │   │       └── route.ts                  # EXISTS: verify PUT works
│   │   └── webhooks/
│   │       └── whatsapp/
│   │           └── route.ts                  # EXISTS: verify signature + tenant resolution
│   └── (cliente)/
│       ├── whatsapp/
│       │   ├── page.tsx                      # EXISTS: verify config save/load
│       │   └── conversaciones/
│       │       └── page.tsx                  # EXISTS: verify loads data
│       └── dashboard/
│           └── page.tsx                      # EXISTS: verify metrics display
├── lib/
│   ├── ai/
│   │   ├── router.ts                         # EXISTS: verify classify/generate
│   │   ├── ollama-client.ts                  # EXISTS
│   │   └── openrouter-client.ts              # EXISTS
│   ├── whatsapp/
│   │   ├── meta-client.ts                    # EXISTS
│   │   ├── resolve-tenant.ts                 # EXISTS
│   │   └── config.ts                         # EXISTS
│   ├── entitlements.ts                       # EXISTS: verify hasFeature/setFeature
│   └── tenant-context.ts                     # EXISTS: verify withTenant/asAdmin
├── n8n-workflows/
│   └── whatsapp-text.json                    # EXISTS: needs import in n8n
├── prisma/
│   └── schema.prisma                         # EXISTS: has Conversation, Message
└── infra/
    └── docker-compose.aicorelink.yml         # MODIFY: add n8n if not external
```

### Phase 2 - WhatsApp Voz
```
apps/dashboard/
├── lib/
│   ├── voice/
│   │   ├── stt.ts                            # EXISTS: Whisper client
│   │   └── tts.ts                            # EXISTS: ElevenLabs client
├── app/
│   └── (cliente)/
│       └── whatsapp/
│           └── page.tsx                      # EXISTS: Voz tab works
├── n8n-workflows/
│   └── whatsapp-voice.json                   # NEW: voice workflow (STT -> router -> TTS optional -> send)
└── infra/
    └── docker-compose.aicorelink.yml         # MODIFY: add aicorelink-whisper service
```

### Phase 3 - Email IA
```
apps/dashboard/
├── prisma/
│   └── schema.prisma                         # MODIFY: add EmailThread, EmailMessage models + RLS
├── lib/
│   └── email/
│       ├── gmail-client.ts                   # NEW: Gmail API client
│       ├── imap-client.ts                    # NEW: IMAP client (fallback)
│       └── classifier.ts                     # NEW: reuse ai/router.ts for classification
├── app/
│   ├── api/
│   │   ├── email/
│   │   │   ├── connect/
│   │   │   │   └── route.ts                  # NEW: OAuth Gmail connect
│   │   │   └── cron/
│   │   │       └── email-poll/
│   │   │           └── route.ts              # NEW: polling endpoint (every 5 min)
│   │   └── webhooks/
│   │       └── email/
│   │           └── route.ts                  # NEW: Gmail push webhook (future)
│   └── (cliente)/
│       └── email/
│           ├── page.tsx                      # NEW: toggle + account connect + config
│           └── bandeja/
│               └── page.tsx                  # NEW: email threads list + detail
├── n8n-workflows/
│   └── email.json                            # NEW: email processing workflow
└── infra/
    └── docker-compose.aicorelink.yml         # MODIFY: add aicorelink-email-worker
```

### Phase 4 - RRSS (Instagram/Messenger)
```
apps/dashboard/
├── prisma/
│   └── schema.prisma                         # MODIFY: add platform field to Conversation
├── lib/
│   └── social/
│       ├── graph-client.ts                   # NEW: Meta Graph API client
│       └── resolve-tenant.ts                 # NEW: page_id -> tenant_id
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── social/
│   │           └── route.ts                  # NEW: Meta Graph webhook (IG + Messenger)
│   └── (cliente)/
│       └── rrss/
│           ├── page.tsx                      # NEW: toggle + page connect + config
│           └── bandeja/
│               └── page.tsx                  # NEW: unified DMs (reuse conversaciones component)
├── n8n-workflows/
│   └── social.json                           # NEW: social processing workflow
└── infra/
    └── docker-compose.aicorelink.yml         # MODIFY: add aicorelink-social-worker
```

### Phase 5 - Métricas Avanzadas & Developer Utilities
```
apps/dashboard/
├── app/
│   ├── api/
│   │   └── alerts/
│   │       └── webhook/
│   │           └── route.ts                  # NEW: receive internal alerts -> Telegram
│   └── (admin)/
│       ├── metricas/
│       │   └── page.tsx                      # EXISTS: verify cost vs plan display
│       └── infraestructura/
│           └── page.tsx                      # EXISTS: verify worker health checks
├── lib/
│   └── monitor/
│       └── telegram.ts                       # NEW: send alerts to Telegram
├── n8n-workflows/
│   └── monitor.json                          # NEW: optional monitoring workflow
└── infra/
    └── docker-compose.aicorelink.yml         # MODIFY: add aicorelink-monitor
```

---

## Task Breakdown

### Phase 1 Completion Tasks

#### Task 1.1: Add Missing Messages API Route
**Files:**
- Create: `apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts`

**Interfaces:**
- Consumes: `withTenant` from `lib/tenant-context.ts`, `GET /api/tenants/conversations` response format
- Produces: JSON array of Message objects for conversation detail view

**Steps:**
- [ ] **Step 1: Write failing test**
```typescript
// Test: GET /api/tenants/conversations/:id/messages returns messages
const res = await fetch('/api/tenants/conversations/test-id/messages');
expect(res.status).toBe(200);
const data = await res.json();
expect(Array.isArray(data)).toBe(true);
```
- [ ] **Step 2: Run test to verify it fails** - Expect 404 route not found
- [ ] **Step 3: Write minimal implementation**
```typescript
// apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "admin_clinica", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Sin tenant" }, { status: 400 });

  const { id } = await params;

  const messages = await withTenant(tenantId, async (tx) => {
    return tx.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
  });

  return NextResponse.json(messages);
}
```
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit** `git add ... && git commit -m "feat(api): add messages route for conversation detail"`

#### Task 1.2: Verify & Configure n8n WhatsApp Workflow
**Files:**
- Modify: n8n instance (external) - import `apps/dashboard/n8n-workflows/whatsapp-text.json`
- Verify: `AICORELINK_N8N_WHATSAPP_WEBHOOK_URL` in Dokploy env vars

**Steps:**
- [ ] **Step 1: Access n8n at https://n8n.aicorebots.com (or VPS IP:5678)**
- [ ] **Step 2: Import workflow** - Upload `whatsapp-text.json` via n8n UI
- [ ] **Step 3: Configure credentials** - Add "AicoreLink Postgres" PostgreSQL credential in n8n
- [ ] **Step 4: Activate workflow** - Set webhook URL to `https://aicorelink.aicorebots.com/api/webhooks/whatsapp`
- [ ] **Step 5: Set env vars in Dokploy** - `AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text`
- [ ] **Step 6: Test** - Send WhatsApp message to test number, verify response

#### Task 1.3: Add Required Env Vars to Dokploy
**Files:**
- Modify: Dokploy service environment variables (via UI or docker service update)

**Required vars for Fase 1:**
```
AICORELINK_META_CLOUD_API_TOKEN=<from Meta Developer Console>
AICORELINK_META_VERIFY_TOKEN=<random string, set in Meta webhook config>
AICORELINK_META_APP_SECRET=<from Meta Developer Console>
AICORELINK_OPENROUTER_API_KEY=<from openrouter.ai>
AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434
AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text
```

**Steps:**
- [ ] **Step 1: Get Meta credentials** from https://developers.facebook.com/apps/
- [ ] **Step 2: Get OpenRouter API key** from https://openrouter.ai/keys
- [ ] **Step 3: Update Dokploy service env vars** via `docker service update --env-add ...`
- [ ] **Step 4: Redeploy and verify** - Check service logs for successful startup

#### Task 1.4: End-to-End Test WhatsApp Texto
**Steps:**
- [ ] **Step 1: Configure Meta webhook** - Set callback URL to `https://aicorelink.aicorebots.com/api/webhooks/whatsapp`, verify token
- [ ] **Step 2: Add phone number** to Meta Business Account
- [ ] **Step 3: Create ChannelCredential** in DB for test tenant:
```sql
INSERT INTO channel_credentials (tenant_id, channel, provider, external_id, encrypted_secret)
VALUES ('<clinica-demo-id>', 'whatsapp_text', 'meta_cloud_api', '<phone_number_id>', '<encrypted_token>');
```
- [ ] **Step 4: Enable whatsapp_text** for tenant via admin panel
- [ ] **Step 5: Send test message** - Verify response received, conversation created, usage logged

---

### Phase 2 - WhatsApp Voz Tasks

#### Task 2.1: Create n8n WhatsApp Voice Workflow
**Files:**
- Create: `apps/dashboard/n8n-workflows/whatsapp-voice.json`

**Workflow nodes:**
1. Webhook trigger (receives from whatsapp webhook with mediaType=audio)
2. Postgres: resolve tenant (same as text)
3. IF: whatsapp_voice enabled
4. HTTP Request: download audio from Meta Media API
5. HTTP Request: Whisper ASR (transcribe)
6. Merge with text flow: classify intent -> generate response
7. IF: voiceReplyEnabled config
8. TRUE branch: HTTP Request: ElevenLabs TTS -> send audio via Meta API
9. FALSE branch: send text via Meta API
10. Log usage & save response (same as text)

**Steps:**
- [ ] **Step 1: Write workflow JSON** based on whatsapp-text.json pattern
- [ ] **Step 2: Import in n8n** and configure credentials
- [ ] **Step 3: Set webhook URL** in Dokploy env: `AICORELINK_N8N_WHATSAPP_VOICE_WEBHOOK_URL`
- [ ] **Step 4: Update whatsapp webhook** to route audio to voice workflow

#### Task 2.2: Add Whisper Service to Docker Compose
**Files:**
- Modify: `infra/docker-compose.aicorelink.yml`

**Add service:**
```yaml
aicorelink-whisper:
  image: onerahmet/openai-whisper-asr-webservice:latest
  environment:
    - ASR_MODEL=base
  networks:
    - internal
  deploy:
    resources:
      limits:
        memory: 2G
    restart_policy:
      condition: on-failure
```

**Steps:**
- [ ] **Step 1: Add service to docker-compose.aicorelink.yml**
- [ ] **Step 2: Add env var** `AICORELINK_WHISPER_URL=http://aicorelink-whisper:9000`
- [ ] **Step 3: Deploy and verify** - Check `curl http://aicorelink-whisper:9000/health`

#### Task 2.3: Add ElevenLabs Env Var & Test Voice End-to-End
**Files:**
- Modify: Dokploy env vars

**Required:**
```
AICORELINK_ELEVENLABS_API_KEY=<from elevenlabs.io>
AICORELINK_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
AICORELINK_TTS_PROVIDER=elevenlabs
AICORELINK_WHISPER_URL=http://aicorelink-whisper:9000
```

**Steps:**
- [ ] **Step 1: Add env vars to Dokploy**
- [ ] **Step 2: Enable whatsapp_voice** for test tenant via admin panel
- [ ] **Step 3: Send voice note** to test number - verify transcription + response
- [ ] **Step 4: Test voiceReplyEnabled** - verify audio response sent

---

### Phase 3 - Email IA Tasks

#### Task 3.1: Add Email Models to Prisma Schema
**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma`

**Add models:**
```prisma
model EmailThread {
  id           String   @id @default(uuid())
  tenantId     String   @map("tenant_id")
  fromAddress  String   @map("from_address")
  subject      String
  category     String?  // consulta | reclamo | agendamiento | spam
  status       String   @default("pendiente")  // pendiente | respondido_ia | respondido_humano | escalado
  createdAt    DateTime @default(now()) @map("created_at")

  emails EmailMessage[]

  @@map("email_threads")
}

model EmailMessage {
  id             String   @id @default(uuid())
  threadId       String   @map("thread_id")
  tenantId       String   @map("tenant_id")
  direction      String   // in | out
  body           String
  aiGenerated    Boolean  @default(false) @map("ai_generated")
  aiConfidence   Float?   @map("ai_confidence")
  createdAt      DateTime @default(now()) @map("created_at")

  thread EmailThread @relation(fields: [threadId], references: [id])

  @@map("email_messages")
}
```

**Add RLS policies** (in migration SQL):
```sql
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON email_threads
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON email_messages
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
```

**Steps:**
- [ ] **Step 1: Add models to schema.prisma**
- [ ] **Step 2: Run `npx prisma migrate dev --name add_email_models`**
- [ ] **Step 3: Apply RLS policies** via `psql $AICORELINK_DATABASE_URL -f prisma/rls.sql` (add email tables)

#### Task 3.2: Create Email Client Libraries
**Files:**
- Create: `apps/dashboard/lib/email/gmail-client.ts`
- Create: `apps/dashboard/lib/email/imap-client.ts`
- Create: `apps/dashboard/lib/email/classifier.ts`

**Steps:**
- [ ] **Step 1: Implement gmail-client.ts** - OAuth2 token management, list messages, get message, send reply
- [ ] **Step 2: Implement imap-client.ts** - IMAP connection, fetch unseen, send via SMTP
- [ ] **Step 3: Implement classifier.ts** - reuse `ai/router.ts` classifyIntent + generateResponse

#### Task 3.3: Create Email API Routes
**Files:**
- Create: `apps/dashboard/app/api/email/connect/route.ts` - OAuth callback, store tokens
- Create: `apps/dashboard/app/api/cron/email-poll/route.ts` - Poll every 5 min, process new emails
- Create: `apps/dashboard/app/api/webhooks/email/route.ts` - Gmail push webhook (optional, future)

**Steps:**
- [ ] **Step 1: Implement OAuth connect** - GET for consent screen, GET callback for token exchange
- [ ] **Step 2: Implement polling cron** - Use `cron` expression or Vercel Cron / custom scheduler
- [ ] **Step 3: Process emails** - For each new email: classify, generate response, send/save draft

#### Task 3.4: Create Client Email Pages
**Files:**
- Create: `apps/dashboard/app/(cliente)/email/page.tsx` - Config + account connection
- Create: `apps/dashboard/app/(cliente)/email/bandeja/page.tsx` - Thread list + detail

**Steps:**
- [ ] **Step 1: Build email config page** - Toggle, Gmail connect button, config (auto-reply categories, confidence threshold)
- [ ] **Step 2: Build bandeja page** - Reuse conversaciones UI pattern, filter by category/status

#### Task 3.5: Create n8n Email Workflow
**Files:**
- Create: `apps/dashboard/n8n-workflows/email.json`

**Workflow:**
1. Cron trigger (every 5 min) OR Webhook (Gmail push)
2. HTTP Request: call `/api/cron/email-poll` or process directly
3. For each email: classify -> check config.autoReplyCategories -> generate response -> send/draft

#### Task 3.6: Add Email Worker to Docker Compose
**Files:**
- Modify: `infra/docker-compose.aicorelink.yml`

**Add:**
```yaml
aicorelink-email-worker:
  image: aicorelink/email-worker:latest
  environment:
    - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
    - AICORELINK_GMAIL_CLIENT_ID=${AICORELINK_GMAIL_CLIENT_ID}
    - AICORELINK_GMAIL_CLIENT_SECRET=${AICORELINK_GMAIL_CLIENT_SECRET}
    - AICORELINK_OPENROUTER_API_KEY=${AICORELINK_OPENROUTER_API_KEY}
  networks:
    - internal
  deploy:
    restart_policy:
      condition: on-failure
```

---

### Phase 4 - RRSS Tasks

#### Task 4.1: Add Platform Field to Conversation Model
**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma`

**Change:**
```prisma
model Conversation {
  // ... existing fields
  platform String?  // instagram | messenger (only when channel = 'social')
}
```

**Steps:**
- [ ] **Step 1: Add platform field**
- [ ] **Step 2: Run migration** `npx prisma migrate dev --name add_platform_to_conversation`
- [ ] **Step 3: Update RLS** (already covered by existing policy on conversations)

#### Task 4.2: Create Social Libraries
**Files:**
- Create: `apps/dashboard/lib/social/graph-client.ts` - Meta Graph API send message
- Create: `apps/dashboard/lib/social/resolve-tenant.ts` - page_id -> tenant_id via channel_credentials

#### Task 4.3: Create Social Webhook
**Files:**
- Create: `apps/dashboard/app/api/webhooks/social/route.ts`

**Handle:**
- GET: verify Meta webhook (hub.challenge)
- POST: validate X-Hub-Signature-256, resolve tenant by page_id, check hasFeature('social'), process via n8n

#### Task 4.4: Create Client RRSS Pages
**Files:**
- Create: `apps/dashboard/app/(cliente)/rrss/page.tsx` - Config + page connection
- Create: `apps/dashboard/app/(cliente)/rrss/bandeja/page.tsx` - Reuse conversaciones component with channel filter

#### Task 4.5: Create n8n Social Workflow
**Files:**
- Create: `apps/dashboard/n8n-workflows/social.json`

**Similar to whatsapp-text but:**
- Trigger: webhook from social route
- Resolve tenant by page_id
- Check hasFeature('social')
- Process with same AI router
- Send via Graph API

#### Task 4.6: Add Social Worker to Docker Compose
**Files:**
- Modify: `infra/docker-compose.aicorelink.yml`

---

### Phase 5 - Métricas Avanzadas Tasks

#### Task 5.1: Add Alert Webhook & Telegram Integration
**Files:**
- Create: `apps/dashboard/app/api/alerts/webhook/route.ts` - Receive alerts, forward to Telegram
- Create: `apps/dashboard/lib/monitor/telegram.ts` - Send message to Telegram bot

**Steps:**
- [ ] **Step 1: Implement telegram.ts** - `sendTelegramAlert(message: string)`
- [ ] **Step 2: Implement alerts webhook** - Validate secret, format message, call telegram.ts
- [ ] **Step 3: Add env vars** `AICORELINK_TELEGRAM_BOT_TOKEN`, `AICORELINK_TELEGRAM_CHAT_ID`

#### Task 5.2: Add Monitor Worker to Docker Compose
**Files:**
- Modify: `infra/docker-compose.aicorelink.yml`

**Add service:**
```yaml
aicorelink-monitor:
  image: aicorelink/monitor:latest
  environment:
    - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
    - AICORELINK_TELEGRAM_BOT_TOKEN=${AICORELINK_TELEGRAM_BOT_TOKEN}
    - AICORELINK_TELEGRAM_CHAT_ID=${AICORELINK_TELEGRAM_CHAT_ID}
  networks:
    - internal
```

#### Task 5.3: Verify & Enhance Existing Admin Pages
**Files:**
- Verify: `apps/dashboard/app/(admin)/metricas/page.tsx`
- Verify: `apps/dashboard/app/(admin)/infraestructura/page.tsx`

**Enhancements:**
- [ ] Add alert history to infraestructura page
- [ ] Add cost trend charts to metricas page
- [ ] Add "test alert" button to infraestructura page

---

## Deployment & Verification Checklist

### Pre-Deployment
- [ ] All Prisma migrations applied on VPS
- [ ] RLS policies applied for all new tables
- [ ] All required env vars set in Dokploy
- [ ] n8n workflows imported and activated
- [ ] Docker services deployed (whisper, email-worker, social-worker, monitor)

### Phase 1 Verification
- [ ] WhatsApp webhook responds to Meta verification
- [ ] Text message → n8n → AI response → user receives reply
- [ ] Conversation appears in client panel
- [ ] Usage metrics update in dashboard

### Phase 2 Verification
- [ ] Voice note → Whisper transcription → AI response
- [ ] voiceReplyEnabled=true → audio response sent
- [ ] voiceReplyEnabled=false → text response sent
- [ ] Cannot enable whatsapp_voice without whatsapp_text

### Phase 3 Verification
- [ ] Gmail OAuth connects successfully
- [ ] Polling fetches new emails
- [ ] Classification works (consulta/reclamo/agendamiento/spam)
- [ ] Auto-reply sends for high-confidence allowed categories
- [ ] Low confidence → draft in bandeja for human review

### Phase 4 Verification
- [ ] Instagram/Messenger webhook verified
- [ ] DM received → appears in unified bandeja
- [ ] AI response sent back
- [ ] Component reused from WhatsApp conversaciones

### Phase 5 Verification
- [ ] Metricas page shows cost vs plan per tenant
- [ ] Infraestructura page shows worker health
- [ ] Stop a worker → Telegram alert within 5 min
- [ ] Error logs visible in audit_log

---

## Execution Order Recommendation

1. **Phase 1 completion** (Tasks 1.1-1.4) - Core revenue feature, highest priority
2. **Phase 2** (Tasks 2.1-2.3) - Extends Phase 1, same infrastructure
3. **Phase 5 core** (Tasks 5.1-5.3) - Observability for all channels
4. **Phase 3** (Tasks 3.1-3.6) - New channel, independent
5. **Phase 4** (Tasks 4.1-4.6) - New channel, reuses Phase 1 patterns

---

## Notes for Implementers

- **Reuse existing patterns:** The codebase has consistent patterns for webhooks, n8n workflows, tenant resolution, RLS context. Follow them exactly.
- **Test incrementally:** After each task, verify the specific feature works before moving on.
- **Env vars first:** Many tasks depend on external API keys. Get credentials early.
- **n8n is external:** Workflows are imported into n8n instance, not deployed with the app.
- **RLS is mandatory:** Every new data table must have RLS policy applied via migration SQL.
- **Admin vs Client context:** Use `asAdmin()` for admin panel queries (bypasses RLS), `withTenant()` for client panel.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-25-implement-all-phases.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**