# AicoreLink — Prompts de construcción por fase (OpenCode / GLM 5.2)

Cómo usar este archivo: pega **solo el bloque de la fase en la que estás trabajando** como contexto de
proyecto en OpenCode (no las seis fases juntas). Cada bloque es autocontenido: trae su propio objetivo,
estructura de carpetas, infraestructura, base de datos, especificación funcional y criterio de aceptación.
Espera a que una fase cumpla su criterio de aceptación antes de pasar a la siguiente.

Contexto compartido que aplica a TODAS las fases (puedes copiarlo una vez al inicio de la sesión de OpenCode
y dejarlo fijo, o repetirlo al inicio de cada prompt de fase si tu flujo de trabajo reinicia contexto):

```
Estás construyendo AicoreLink, una plataforma agéntica multicanal (WhatsApp texto, WhatsApp voz, Email con
IA, Redes Sociales con IA) para clínicas médicas, desarrollada por Aicore Agency. Se activa por módulos según
lo que cada clínica contrate. Se instala en el mismo VPS donde ya corre AiCoreMed (Next.js + PostgreSQL +
n8n + Docker Swarm/Dokploy + Traefik + Redis + Cloudflare bajo el dominio aicorebots.com), reutilizando esa
infraestructura, no reemplazándola.

Regla no negociable de todo el proyecto: agregar un cliente (tenant) nuevo debe ser una operación de DATOS
(insertar filas), nunca una operación de CÓDIGO (crear un endpoint, workflow o servicio nuevo por cliente).

Modelo de multi-tenancy: base de datos PostgreSQL compartida, con columna tenant_id en cada tabla de datos
operativos y Row Level Security (RLS) activado como defensa en profundidad — nunca base de datos ni schema
por tenant.

Prefijo de variables de entorno del proyecto: AICORELINK_
Prefijo de nombres de servicio Docker: aicorelink-*
Dominio del dashboard: link.aicorebots.com (un solo dominio, el tenant se resuelve por sesión de login, NO
por subdominio).
```

---

## FASE 0 — FUNDACIÓN

### Objetivo y alcance
Construir la base sobre la que se apoyan todas las fases siguientes: modelo de datos multi-tenant con RLS,
autenticación con roles, shell de dashboard (panel cliente + panel admin) sin lógica de negocio de canales
todavía, e integración de cobro recurrente. Al terminar esta fase NO debe existir todavía ningún canal
(WhatsApp/Email/RRSS) funcional — eso es la Fase 1 en adelante. Lo que sí debe existir es la capacidad de
crear un tenant, loguearse como ese tenant, y ver un dashboard vacío pero funcional con navegación real.

### Estructura de carpetas y archivos a crear
```
aicorelink/
├── apps/
│   └── dashboard/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                      # landing/redirect según sesión
│       │   ├── login/
│       │   │   └── page.tsx
│       │   ├── (cliente)/
│       │   │   ├── layout.tsx                # layout con sidebar de módulos del tenant
│       │   │   └── dashboard/
│       │   │       └── page.tsx              # placeholder: "Bienvenido, aún sin módulos activos"
│       │   ├── (admin)/
│       │   │   ├── layout.tsx                # layout con sidebar de administración
│       │   │   ├── tenants/
│       │   │   │   ├── page.tsx              # listado de tenants
│       │   │   │   └── [tenantId]/page.tsx   # detalle: activar/desactivar módulos, ver plan
│       │   │   └── page.tsx                  # overview admin (placeholder de métricas globales)
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts
│       │       ├── tenants/route.ts           # CRUD de tenants (solo rol dev_aicore)
│       │       ├── tenants/[id]/channels/route.ts  # activar/desactivar módulos
│       │       └── billing/webhook/route.ts   # placeholder de webhook de pago
│       ├── lib/
│       │   ├── db.ts                          # cliente Prisma singleton
│       │   ├── auth.ts                        # configuración de NextAuth
│       │   ├── tenant-context.ts              # helper withTenant(tenantId, callback) que hace SET app.current_tenant
│       │   ├── entitlements.ts                # hasFeature(tenantId, channel) y setFeature(...)
│       │   ├── rbac.ts                        # helpers requireRole('dev_aicore' | 'admin_clinica' | 'cliente')
│       │   └── audit.ts                       # logAudit(tenantId, actorId, action, meta)
│       ├── middleware.ts                      # protección de rutas (cliente) y (admin) según rol/sesión
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/                    # generadas por prisma migrate dev
│       └── package.json
├── infra/
│   ├── docker-compose.aicorelink.yml          # solo el servicio dashboard en esta fase
│   ├── .env.example
│   └── traefik-labels.md                      # documentación de las labels usadas
└── docs/
    └── decisiones-fase-0.md                   # registro de decisiones tomadas durante la fase
```

### Infraestructura (Docker Swarm / Dokploy / Traefik)
En esta fase solo se despliega el dashboard. Reutiliza la red de Traefik y la instancia de PostgreSQL/Redis
que ya existen para AiCoreMed — no levantes un Postgres ni un Redis nuevos.

```yaml
# infra/docker-compose.aicorelink.yml
version: "3.8"
services:
  aicorelink-dashboard:
    image: aicorelink/dashboard:latest
    environment:
      - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
      - AICORELINK_NEXTAUTH_SECRET=${AICORELINK_NEXTAUTH_SECRET}
      - AICORELINK_NEXTAUTH_URL=https://link.aicorebots.com
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    networks:
      - traefik-public
      - internal
    labels:
      - traefik.enable=true
      - traefik.http.routers.aicorelink.rule=Host(`link.aicorebots.com`)
      - traefik.http.routers.aicorelink.tls.certresolver=letsencrypt
      - traefik.http.services.aicorelink.loadbalancer.server.port=3000

networks:
  traefik-public:
    external: true
  internal:
    external: true
```

`.env.example` completo a crear:
```
AICORELINK_DATABASE_URL=postgresql://user:pass@host:5432/aicorelink
AICORELINK_NEXTAUTH_SECRET=
AICORELINK_NEXTAUTH_URL=https://link.aicorebots.com
AICORELINK_ENCRYPTION_KEY=          # usada por lib de encriptación de channel_credentials en fases futuras
```

Nota importante de infraestructura: la base de datos puede vivir en la misma instancia Postgres de
AiCoreMed pero en una **base de datos o esquema separado** llamado `aicorelink`, para no mezclar
migraciones ni riesgo de nombres de tabla duplicados con AiCoreMed.

### Base de datos (Prisma schema completo de esta fase)
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("AICORELINK_DATABASE_URL")
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  plan      String   @default("basico")
  status    String   @default("activo")
  createdAt DateTime @default(now()) @map("created_at")

  users     TenantUser[]
  channels  TenantChannel[]
  users2    TenantUsage[]
  credentials ChannelCredential[]

  @@map("tenants")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?  @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  tenantLinks  TenantUser[]

  @@map("users")
}

model TenantUser {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  userId   String @map("user_id")
  role     String @default("cliente") // cliente | admin_clinica | dev_aicore

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([tenantId, userId])
  @@map("tenant_users")
}

model TenantChannel {
  id           String    @id @default(uuid())
  tenantId     String    @map("tenant_id")
  channel      String    // whatsapp_text | whatsapp_voice | email | social
  enabled      Boolean   @default(false)
  config       Json      @default("{}")
  activatedAt  DateTime? @map("activated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, channel])
  @@map("tenant_channels")
}

model ChannelCredential {
  id               String   @id @default(uuid())
  tenantId         String   @map("tenant_id")
  channel          String
  provider         String
  externalId       String?  @map("external_id")
  encryptedSecret  String   @map("encrypted_secret")
  createdAt        DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@map("channel_credentials")
}

model TenantUsage {
  id           String   @id @default(uuid())
  tenantId     String   @map("tenant_id")
  channel      String
  period       DateTime // primer día del mes
  messagesIn   Int      @default(0) @map("messages_in")
  messagesOut  Int      @default(0) @map("messages_out")
  tokensUsed   Int      @default(0) @map("tokens_used")
  costEstimate Decimal  @default(0) @map("cost_estimate")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, channel, period])
  @@map("tenant_usage")
}

model AuditLog {
  id        String   @id @default(uuid())
  tenantId  String?  @map("tenant_id")
  actorId   String?  @map("actor_id")
  action    String
  meta      Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("audit_log")
}
```

Después de generar la migración inicial con Prisma, agrega manualmente en una migración SQL adicional
(Prisma no gestiona RLS nativamente):

```sql
ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_channels
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_credentials
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_usage
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- El rol dev_aicore (panel admin) debe poder ver todos los tenants: crear un rol de base de datos
-- separado (aicorelink_admin) que hace BYPASSRLS solo para las queries del panel admin, nunca para
-- las queries que sirven al panel cliente.
```

### Especificación funcional

**`lib/tenant-context.ts`** — helper obligatorio, toda query del panel cliente debe pasar por acá:
```ts
export async function withTenant<T>(tenantId: string, fn: (tx: PrismaTransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    return fn(tx);
  });
}
```

**`lib/entitlements.ts`**:
```ts
export async function hasFeature(tenantId: string, channel: Channel): Promise<boolean> {
  const row = await withTenant(tenantId, (tx) =>
    tx.tenantChannel.findFirst({ where: { tenantId, channel, enabled: true } })
  );
  return !!row;
}

export async function setFeature(tenantId: string, channel: Channel, enabled: boolean, actorId: string) {
  // solo invocable desde el panel admin o desde el webhook de billing tras pago confirmado
  // debe registrar en audit_log quién activó/desactivó y cuándo
}
```

**NextAuth (`lib/auth.ts`)**: el callback `jwt` y `session` deben embeber `tenantId` (del `TenantUser` activo)
y `role`. Un usuario con más de un tenant asociado (caso futuro de agencias que gestionan varias clínicas)
debe poder seleccionar tenant activo tras el login — no es necesario resolverlo en esta fase, pero el modelo
de datos ya lo soporta.

**`middleware.ts`**: redirige a `/login` si no hay sesión; bloquea `(admin)/*` si `role !== 'dev_aicore'`;
bloquea `(cliente)/*` si no hay `tenantId` en la sesión.

**Panel cliente (`(cliente)/dashboard/page.tsx`)**: página placeholder que muestra el nombre del tenant, su
plan actual, y una lista de módulos con su estado (activado/desactivado) leída de `tenant_channels` — sin
ninguna acción todavía, es solo lectura en esta fase.

**Panel admin (`(admin)/tenants/page.tsx`)**: listado de todos los tenants (bypassa RLS con el rol de DB
`aicorelink_admin`), con acceso al detalle de cada uno donde se puede activar/desactivar manualmente cada
canal (esto ya debe funcionar end-to-end en esta fase, aunque los canales en sí no hagan nada todavía —
es la base del sistema de feature flags que usarán las fases siguientes).

**Billing webhook (`api/billing/webhook/route.ts`)**: placeholder que recibe el evento de pago confirmado
(Stripe o Flow, a definir) y llama a `setFeature()` — en esta fase basta con que el endpoint exista, valide
firma del webhook, y loguee el evento en `audit_log`; la integración real de checkout puede completarse en
paralelo o en una fase posterior sin bloquear el resto.

### Criterio de aceptación de la Fase 0
- [ ] Puedo insertar un tenant nuevo directamente en la base de datos (sin tocar código) y hacer login como
      un usuario asociado a ese tenant.
- [ ] Con dos tenants de prueba, un usuario del tenant A no puede ver ni activar módulos del tenant B, ni
      siquiera manipulando la URL directamente (probar `/admin/tenants/<id-de-otro-tenant>` como cliente).
- [ ] Las políticas RLS están activas y se puede demostrar con una query directa a Postgres (conectado como
      el rol de aplicación, no como admin) que no devuelve filas de otro tenant sin el `SET app.current_tenant`.
- [ ] El panel admin puede activar/desactivar un canal para un tenant y el cambio queda registrado en
      `audit_log`.
- [ ] El servicio `aicorelink-dashboard` levanta correctamente en Docker Swarm vía Dokploy y responde en
      `https://link.aicorebots.com`.

---

## FASE 1 — WHATSAPP TEXTO (MVP VENDIBLE)

### Objetivo y alcance
Primer canal real y primer módulo facturable. Un mensaje de WhatsApp de un paciente debe llegar, resolverse
al tenant correcto, respetar el feature flag `whatsapp_text`, generar una respuesta con IA, enviarse de
vuelta, y quedar registrado en métricas. Fuera de alcance: voz (Fase 2), email (Fase 3), RRSS (Fase 4).

### Estructura de carpetas y archivos a crear (sobre lo ya existente de Fase 0)
```
aicorelink/
├── apps/
│   ├── dashboard/
│   │   ├── app/
│   │   │   ├── (cliente)/
│   │   │   │   ├── whatsapp/
│   │   │   │   │   ├── page.tsx              # toggle del canal + config (tono, horarios, base de conocimiento)
│   │   │   │   │   └── conversaciones/page.tsx  # listado de conversaciones recientes
│   │   │   │   └── dashboard/page.tsx        # actualizar con métricas reales de WhatsApp si está activo
│   │   │   └── api/
│   │   │       └── webhooks/whatsapp/route.ts  # verificación de webhook de Meta (GET) + recepción (POST)
│   │   ├── lib/
│   │   │   ├── ai/
│   │   │   │   ├── router.ts                 # decide Ollama/Gemma3 vs GLM 5.2/OpenRouter según complejidad
│   │   │   │   ├── ollama-client.ts
│   │   │   │   └── openrouter-client.ts
│   │   │   └── whatsapp/
│   │   │       ├── meta-client.ts            # envío de mensajes vía Meta Cloud API
│   │   │       └── resolve-tenant.ts         # phone_number_id -> tenant_id (consulta channel_credentials)
│   │   └── prisma/
│   │       └── migrations/                   # nueva migración: tabla conversations + messages
│   └── whatsapp-worker/                       # opcional: si se decide separar del proceso Next.js
│       ├── src/
│       │   ├── index.ts
│       │   └── handlers/inbound.ts
│       ├── Dockerfile
│       └── package.json
├── n8n-workflows/
│   └── whatsapp-text.json                    # workflow importable a n8n (ver especificación de nodos abajo)
└── infra/
    └── docker-compose.aicorelink.yml          # agregar servicio aicorelink-whatsapp-worker si aplica
```

Decisión a tomar explícitamente al inicio de esta fase: ¿el procesamiento de WhatsApp corre dentro de un
route handler de Next.js, o se delega a un worker Node separado (`apps/whatsapp-worker`) orquestado por n8n?
Recomendación: para volumen bajo-medio (clínicas piloto), un route handler de Next.js que dispara la
ejecución de n8n vía webhook es suficiente y más simple de operar; separar en worker independiente solo si
el volumen lo justifica más adelante.

### Infraestructura
```yaml
# agregar a infra/docker-compose.aicorelink.yml
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

Variables nuevas en `.env.example`:
```
AICORELINK_META_CLOUD_API_TOKEN=
AICORELINK_META_VERIFY_TOKEN=
AICORELINK_META_PHONE_NUMBER_ID=      # solo si se usa un único número compartido en modo prueba
AICORELINK_OPENROUTER_API_KEY=
AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434   # reutilizar el mismo patrón ya usado en AiCoreMed
```

Nota de infraestructura importante: el webhook de Meta es **uno solo por app de Meta**, no uno por tenant.
La resolución de a qué tenant pertenece un mensaje entrante se hace por `phone_number_id`, consultando
`channel_credentials` donde `provider = 'meta_cloud_api'` y `external_id = phone_number_id`.

### Base de datos (migración adicional de esta fase)
```prisma
model Conversation {
  id         String   @id @default(uuid())
  tenantId   String   @map("tenant_id")
  channel    String   @default("whatsapp_text")
  contactRef String   @map("contact_ref")   // número de teléfono del paciente
  status     String   @default("abierta")
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
Agregar RLS a ambas tablas con la misma política usada en Fase 0.

### Especificación funcional

**Webhook de Meta (`api/webhooks/whatsapp/route.ts`)**:
- `GET`: responde el `hub.challenge` para la verificación inicial de Meta, validando `AICORELINK_META_VERIFY_TOKEN`.
- `POST`: recibe el payload de Meta, extrae `phone_number_id` y el mensaje entrante, y:
  1. Resuelve `tenant_id` vía `resolve-tenant.ts` (`channel_credentials` donde `external_id = phone_number_id`).
     Si no se encuentra tenant, responder 200 sin procesar (nunca dejar el webhook colgando ni devolver error
     a Meta por un tenant desconocido).
  2. Llama a `hasFeature(tenantId, 'whatsapp_text')`. Si es `false`, responder 200 sin generar respuesta al
     paciente (opcionalmente, un mensaje genérico configurable en `tenant_channels.config`).
  3. Busca o crea la `Conversation` correspondiente al `contactRef` dentro del contexto `withTenant`.
  4. Guarda el `Message` entrante.
  5. Llama a `lib/ai/router.ts` con el historial reciente de la conversación y la `config` del tenant (tono,
     base de conocimiento) para generar la respuesta.
  6. Envía la respuesta vía `meta-client.ts`.
  7. Guarda el `Message` saliente y actualiza `tenant_usage` (mensajes in/out, tokens, costo estimado).
  8. Si el router de IA determina baja confianza o palabras clave de escalado (definir lista configurable
     por tenant), marca `conversation.escalado = true`.

**`lib/ai/router.ts`**: lógica de decisión simple para esta fase — usar Ollama/Gemma3 para clasificar
intención (consulta simple vs compleja); si es simple, responder directo con Gemma3; si es compleja o de
alto valor (ej. agendamiento, queja), usar GLM 5.2 vía OpenRouter. Esto controla el costo variable por
tenant desde el día uno.

**Workflow n8n (`n8n-workflows/whatsapp-text.json`)** — especificación de nodos si se decide orquestar vía
n8n en vez de (o además de) el route handler:
1. Webhook trigger (recibe el payload reenviado desde el route handler o directo de Meta).
2. Nodo Postgres: resolver tenant por `phone_number_id`.
3. Nodo IF: `tenant_channels.enabled = true` para `whatsapp_text` — si no, terminar el flujo.
4. Nodo HTTP Request u Ollama node: clasificación de intención.
5. Nodo IF: simple vs compleja -> rama Ollama vs rama OpenRouter.
6. Nodo HTTP Request: enviar respuesta vía Meta Cloud API.
7. Nodo Postgres: insertar en `messages` y actualizar `tenant_usage`.

**Panel cliente — `(cliente)/whatsapp/page.tsx`**: toggle de activación (solo lectura del estado real; la
activación efectiva pasa por el flujo de billing/admin, no por un toggle libre del cliente), edición de
`config` (tono de respuesta, horario de atención, base de conocimiento en texto libre o FAQ estructurada).

**Panel cliente — `conversaciones/page.tsx`**: listado de conversaciones recientes con estado (abierta,
escalada, cerrada), y detalle de mensajes de cada una.

**Actualizar `dashboard/page.tsx`**: mostrar métricas reales si `whatsapp_text` está activo: mensajes
procesados en el período, % de conversaciones resueltas por IA vs. escaladas a humano, tiempo promedio de
primera respuesta.

### Criterio de aceptación de la Fase 1
- [ ] Un mensaje real enviado al número de WhatsApp de un tenant de prueba llega, se resuelve al tenant
      correcto, y se responde automáticamente con una respuesta coherente.
- [ ] Si desactivo `whatsapp_text` para ese tenant desde el panel admin, el mismo número deja de generar
      respuestas automáticas (el webhook sigue recibiendo pero no procesa).
- [ ] `tenant_usage` refleja mensajes entrantes/salientes y tokens usados tras la prueba anterior.
- [ ] Un mensaje con una palabra clave de escalado (ej. "quiero hablar con una persona") marca la
      conversación como `escalado = true` y aparece señalada en el panel cliente.
- [ ] Un tenant no puede ver conversaciones ni mensajes de otro tenant (repetir la prueba de aislamiento de
      la Fase 0, ahora sobre `conversations` y `messages`).

---

## FASE 2 — WHATSAPP VOZ

### Objetivo y alcance
Extender el canal de WhatsApp para manejar notas de voz entrantes (transcribir y procesar como si fuera
texto) y, opcionalmente, responder en audio. Depende directamente de la Fase 1 — no se construye en
paralelo ni antes.

### Estructura de carpetas y archivos a crear
```
aicorelink/
├── apps/
│   └── dashboard/
│       ├── lib/
│       │   └── voice/
│       │       ├── stt.ts                    # transcripción vía Whisper
│       │       └── tts.ts                    # generación de audio vía ElevenLabs (o alternativa local)
│       └── app/
│           └── (cliente)/
│               └── whatsapp/
│                   └── voz/page.tsx          # toggle independiente whatsapp_voice + configuración de voz
```

### Infraestructura
```yaml
# agregar a infra/docker-compose.aicorelink.yml
  aicorelink-whisper:
    image: onerahmet/openai-whisper-asr-webservice:latest   # o el runner de Whisper que ya uses en el VPS
    environment:
      - ASR_MODEL=base
    networks:
      - internal
    deploy:
      resources:
        limits:
          memory: 2G     # ajustar según capacidad real del VPS, cuidar el mismo tipo de problema de OOM ya visto
```

Variables nuevas:
```
AICORELINK_WHISPER_URL=http://aicorelink-whisper:9000
AICORELINK_ELEVENLABS_API_KEY=
AICORELINK_ELEVENLABS_VOICE_ID=
AICORELINK_TTS_PROVIDER=elevenlabs     # elevenlabs | local (para permitir migrar a un TTS local si el costo variable crece)
```

Nota de infraestructura: antes de desplegar el contenedor de Whisper, revisar la memoria disponible real
del VPS — ya hubo un incidente de OOM con Ollama; sumar un servicio de transcripción sin holgura de memoria
puede repetir ese problema. Considerar límites de memoria explícitos y monitoreo.

### Base de datos
```prisma
// Extender Message con metadata de voz
model Message {
  // ... campos ya existentes de Fase 1
  mediaType   String?  @map("media_type")   // text | audio
  audioUrl    String?  @map("audio_url")    // referencia al archivo de audio original, si aplica
  transcript  String?                        // texto transcrito, si mediaType = audio
}
```

### Especificación funcional
- Extender el webhook de WhatsApp (`api/webhooks/whatsapp/route.ts`) para detectar `type = "audio"` en el
  payload de Meta, descargar el audio vía Meta Media API, y enviarlo a `lib/voice/stt.ts` antes de continuar
  con el mismo flujo de IA ya construido en la Fase 1 (el resto del pipeline — resolver tenant, feature
  flag, IA, guardar mensaje — se reutiliza sin duplicar lógica).
- El feature flag a verificar es `whatsapp_voice`, independiente de `whatsapp_text` — un tenant puede tener
  texto sin voz, pero no voz sin texto (definir esta dependencia explícitamente en la validación de
  activación del panel admin: no permitir activar `whatsapp_voice` si `whatsapp_text` no está activo).
- Respuesta en audio: configurable por tenant (`config.voice_reply_enabled: boolean`). Si está activo,
  generar audio de la respuesta vía `lib/voice/tts.ts` y enviarlo como nota de voz por Meta Cloud API; si no,
  responder en texto aunque la entrada haya sido audio.
- Medir y loguear la latencia total (recepción de audio -> respuesta enviada) en `tenant_usage` o una tabla
  de métricas de latencia, para verificar el objetivo de rendimiento.

### Criterio de aceptación de la Fase 2
- [ ] Una nota de voz de prueba enviada al número de un tenant con `whatsapp_voice` activo se transcribe
      correctamente y genera una respuesta coherente en menos de 8 segundos extremo a extremo.
- [ ] Si `config.voice_reply_enabled = false`, la respuesta llega en texto aunque la entrada fue audio.
- [ ] No se puede activar `whatsapp_voice` para un tenant que no tiene `whatsapp_text` activo (validado
      tanto en la UI del panel admin como en el backend).
- [ ] El servicio de Whisper no provoca inestabilidad de memoria en el VPS bajo uso normal (validar con
      monitoreo básico durante pruebas).

---

## FASE 3 — EMAIL CON IA

### Objetivo y alcance
Triage y respuesta (sugerida o automática, según configuración) de correo entrante de la clínica. Canal
independiente de WhatsApp — un tenant puede tener email sin tener WhatsApp activo.

### Estructura de carpetas y archivos a crear
```
aicorelink/
├── apps/
│   └── dashboard/
│       ├── app/
│       │   ├── (cliente)/
│       │   │   └── email/
│       │   │       ├── page.tsx              # toggle + conexión de cuenta de correo + configuración
│       │   │       └── bandeja/page.tsx      # correos procesados, clasificación, respuesta sugerida/enviada
│       │   └── api/
│       │       ├── email/connect/route.ts    # OAuth de Gmail o config IMAP genérica
│       │       └── cron/email-poll/route.ts  # polling periódico si no se usa push notification de Gmail
│       └── lib/
│           └── email/
│               ├── gmail-client.ts
│               ├── imap-client.ts
│               └── classifier.ts             # clasificación: consulta | reclamo | agendamiento | spam
├── n8n-workflows/
│   └── email.json
```

### Infraestructura
```yaml
# agregar a infra/docker-compose.aicorelink.yml
  aicorelink-email-worker:
    image: aicorelink/email-worker:latest
    environment:
      - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
      - AICORELINK_GMAIL_CLIENT_ID=${AICORELINK_GMAIL_CLIENT_ID}
      - AICORELINK_GMAIL_CLIENT_SECRET=${AICORELINK_GMAIL_CLIENT_SECRET}
      - AICORELINK_OPENROUTER_API_KEY=${AICORELINK_OPENROUTER_API_KEY}
    networks:
      - internal
```

Variables nuevas:
```
AICORELINK_GMAIL_CLIENT_ID=
AICORELINK_GMAIL_CLIENT_SECRET=
AICORELINK_EMAIL_POLL_INTERVAL_MIN=5   # solo si se usa polling en vez de push (Gmail Pub/Sub)
```

Decisión a tomar explícitamente: usar Gmail API con push notifications (Pub/Sub) para tiempo real, o
polling periódico simple para el MVP. Recomendación: empezar con polling cada 5 minutos para el piloto —
es mucho más simple de implementar y suficiente para el volumen inicial; migrar a push solo si el volumen
lo justifica.

### Base de datos
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
Agregar RLS a ambas tablas.

### Especificación funcional
- `lib/email/classifier.ts`: usa el mismo `ai/router.ts` de la Fase 1 (reutilizar, no duplicar) para
  clasificar cada correo entrante en una categoría y determinar si corresponde respuesta automática o solo
  sugerida, según `config.email_auto_reply_categories` del tenant (ej. el tenant puede permitir auto-reply
  solo para "consulta" y exigir revisión humana para "reclamo").
- Regla de escalado: si `aiConfidence` es menor a un umbral configurable (default 0.7), el correo pasa a
  `status = 'pendiente'` con una respuesta sugerida visible en el panel, pero no se envía automáticamente.
- Panel cliente (`bandeja/page.tsx`): lista de threads con su categoría, estado, y acción de aprobar/editar/
  enviar la respuesta sugerida cuando no fue auto-enviada.
- Feature flag a verificar: `email`, independiente de los canales de WhatsApp.

### Criterio de aceptación de la Fase 3
- [ ] Un correo de prueba enviado a la cuenta conectada de un tenant se clasifica correctamente en una de
      las categorías definidas.
- [ ] Si la categoría está permitida para auto-respuesta y la confianza supera el umbral, se envía la
      respuesta automáticamente y queda registrada.
- [ ] Si la confianza es baja o la categoría no está permitida, el correo queda en estado `pendiente` con
      una respuesta sugerida visible en el panel, sin enviarse solo.
- [ ] Desactivar el feature flag `email` detiene el procesamiento sin afectar WhatsApp del mismo tenant.

---

## FASE 4 — RRSS (INSTAGRAM / MESSENGER)

### Objetivo y alcance
Bandeja unificada de mensajes directos de Instagram y Messenger, usando el mismo motor de agente y el mismo
modelo de configuración (`config JSONB`) ya usado en los canales anteriores.

### Estructura de carpetas y archivos a crear
```
aicorelink/
├── apps/
│   └── dashboard/
│       ├── app/
│       │   ├── (cliente)/
│       │   │   └── rrss/
│       │   │       ├── page.tsx              # toggle + conexión de páginas de Instagram/Messenger
│       │   │       └── bandeja/page.tsx      # bandeja unificada de DMs
│       │   └── api/
│       │       └── webhooks/social/route.ts  # webhook único de Meta Graph API (Instagram + Messenger)
│       └── lib/
│           └── social/
│               ├── graph-client.ts           # envío de mensajes vía Meta Graph API
│               └── resolve-tenant.ts         # page_id -> tenant_id (channel_credentials)
├── n8n-workflows/
│   └── social.json
```

### Infraestructura
```yaml
# agregar a infra/docker-compose.aicorelink.yml
  aicorelink-social-worker:
    image: aicorelink/social-worker:latest
    environment:
      - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
      - AICORELINK_META_GRAPH_API_TOKEN=${AICORELINK_META_GRAPH_API_TOKEN}
      - AICORELINK_META_VERIFY_TOKEN=${AICORELINK_META_VERIFY_TOKEN}
    networks:
      - internal
```

Variables nuevas:
```
AICORELINK_META_GRAPH_API_TOKEN=
AICORELINK_META_APP_SECRET=          # para validar la firma de los webhooks de Meta Graph API
```

### Base de datos
Reutilizar `Conversation` y `Message` de la Fase 1, generalizando el campo `channel` a `social` y agregando
`platform` (`instagram` | `messenger`) para diferenciar dentro del mismo canal:
```prisma
model Conversation {
  // ... campos ya existentes
  platform String?  // instagram | messenger, solo aplica cuando channel = 'social'
}
```

### Especificación funcional
- El webhook (`api/webhooks/social/route.ts`) sigue exactamente el mismo patrón que el de WhatsApp de la
  Fase 1: resolver tenant por `page_id` (channel_credentials), verificar `hasFeature(tenantId, 'social')`,
  procesar con el mismo `ai/router.ts`, responder vía `graph-client.ts`, y registrar en `tenant_usage`.
- Validar la firma `X-Hub-Signature-256` de cada request usando `AICORELINK_META_APP_SECRET` antes de
  procesar cualquier payload.
- Panel cliente (`bandeja/page.tsx`): reutilizar el componente de listado de conversaciones ya construido
  para WhatsApp en la Fase 1, filtrando por `channel = 'social'` — no duplicar el componente de UI.

### Criterio de aceptación de la Fase 4
- [ ] Un mensaje directo de prueba a la página de Instagram de un tenant con `social` activo llega a la
      bandeja unificada correcta y genera respuesta.
- [ ] La firma de los webhooks se valida correctamente y se rechazan requests con firma inválida.
- [ ] El mismo componente de bandeja de conversaciones muestra correctamente tanto WhatsApp como RRSS,
      diferenciados por canal/plataforma.

---

## FASE 5 — MÉTRICAS AVANZADAS Y UTILIDADES DEVELOPER

### Objetivo y alcance
Dar visibilidad operativa fina tanto al cliente (mejor entendimiento de valor recibido) como al equipo de
Aicore Agency (control de margen y salud de infraestructura). No agrega canales nuevos.

### Estructura de carpetas y archivos a crear
```
aicorelink/
├── apps/
│   └── dashboard/
│       └── app/
│           └── (admin)/
│               ├── metricas/
│               │   └── page.tsx              # costo real (tokens x tarifa) vs. plan facturado, por tenant
│               ├── infraestructura/
│               │   └── page.tsx              # salud de workers, últimas caídas, alertas activas
│               └── api/
│                   └── alerts/webhook/route.ts  # recibe alertas internas y las reenvía a Telegram
```

### Infraestructura
```yaml
# agregar a infra/docker-compose.aicorelink.yml (o un cron/servicio ligero)
  aicorelink-monitor:
    image: aicorelink/monitor:latest
    environment:
      - AICORELINK_DATABASE_URL=${AICORELINK_DATABASE_URL}
      - AICORELINK_TELEGRAM_BOT_TOKEN=${AICORELINK_TELEGRAM_BOT_TOKEN}
      - AICORELINK_TELEGRAM_CHAT_ID=${AICORELINK_TELEGRAM_CHAT_ID}
    networks:
      - internal
```
Reutilizar el mismo patrón de notificación por Telegram ya usado con Hermes Agent — no construir un canal
de alertas nuevo desde cero.

### Base de datos
```prisma
model CostRate {
  id        String  @id @default(uuid())
  provider  String  // openrouter | meta_cloud_api | elevenlabs | whisper
  unit      String  // token | message | minute
  rate      Decimal
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("cost_rates")
}
```
Usado para calcular `tenant_usage.cost_estimate` de forma centralizada en vez de hardcodear tarifas en cada
worker de canal.

### Especificación funcional
- Panel admin `metricas/page.tsx`: por cada tenant, mostrar costo real acumulado del período (suma de
  `tenant_usage.cost_estimate` de todos sus canales) versus el precio del plan contratado — visibilizar
  margen real, no solo ingresos.
- Panel admin `infraestructura/page.tsx`: estado de cada worker (`aicorelink-whatsapp-worker`,
  `aicorelink-email-worker`, `aicorelink-social-worker`, `aicorelink-whisper`), última vez visto activo, y
  errores recientes agregados desde logs.
- Alertas: cuando un worker no responde a un health-check simple por más de N minutos (definir umbral,
  sugerido 5 minutos), enviar alerta a Telegram vía `aicorelink-monitor`, replicando el patrón ya usado con
  Hermes Agent.

### Criterio de aceptación de la Fase 5
- [ ] El panel admin muestra, para cada tenant, costo real vs. plan facturado del período actual.
- [ ] Al detener manualmente un worker de canal (prueba controlada), llega una alerta a Telegram dentro del
      umbral definido.
- [ ] Los logs de errores recientes por canal son visibles desde el panel admin sin necesidad de entrar por
      SSH al VPS.
