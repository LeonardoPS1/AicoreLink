# Fix Deployment: Database Setup & Dokploy Config

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the `aicorelink` database on the shared PostgreSQL instance, run migrations, apply RLS, seed data, configure Dokploy env vars, and redeploy so features become visible at `AicoreLink.aicorebots.com`.

**Architecture:** PostgreSQL shared instance (same as AiCoreMed) → new database `aicorelink` → Prisma migrations → RLS policies → seed tenant/user → Dokploy env vars → deploy.

**Tech Stack:** PostgreSQL, Prisma, Docker/Dokploy, Next.js 14

## Global Constraints

- VPS IP: `51.222.207.250`
- PostgreSQL: shared instance (same as AiCoreMed), internal hostname needed
- Database name: `aicorelink`
- Database user: `aicorelink_app` (no BYPASSRLS)
- Admin user: `aicorelink_admin` (BYPASSRLS)
- Domain: `AicoreLink.aicorebots.com`
- Dokploy service: `aicorelink-aicorelink-b7m7ol`
- Build path in Dokploy: `apps/dashboard`

---

### Task 1: Create Database & Users on VPS

**Files:**
- Run on VPS via SSH: `psql` commands

**Commands to run on VPS (51.222.207.250) as postgres superuser:**

```bash
# 1. Connect to VPS
ssh root@51.222.207.250

# 2. Connect to PostgreSQL as superuser (adjust if different)
sudo -u postgres psql

# 3. Create database and users
CREATE DATABASE aicorelink;
CREATE ROLE aicorelink_app LOGIN PASSWORD 'GENERATE_SECURE_PASSWORD_HERE';
CREATE ROLE aicorelink_admin LOGIN PASSWORD 'GENERATE_SECURE_PASSWORD_HERE' BYPASSRLS;

# 4. Grant permissions
GRANT ALL ON DATABASE aicorelink TO aicorelink_app, aicorelink_admin;
\c aicorelink
GRANT ALL ON SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aicorelink_app, aicorelink_admin;

# 5. Enable uuid-ossp extension (needed for uuid_generate_v4 if used)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

- [ ] **Step 1.1:** SSH into VPS and run the SQL commands above
- [ ] **Step 1.2:** Save the generated passwords for `aicorelink_app` and `aicorelink_admin`
- [ ] **Step 1.3:** Construct `AICORELINK_DATABASE_URL` = `postgresql://aicorelink_app:PASSWORD@HOST_POSTGRES_INTERNO:5432/aicorelink`

> **Note:** `HOST_POSTGRES_INTERNO` is the internal Docker network hostname for the shared PostgreSQL. Check Dokploy or `docker network inspect` to find it. It might be something like `postgres` or `postgres-postgres-1`.

---

### Task 2: Run Prisma Migrations

**Files:**
- `apps/dashboard/prisma/schema.prisma` (already has Conversation, Message models)
- Migration files will be created in `apps/dashboard/prisma/migrations/`

**Interfaces:**
- Consumes: Database from Task 1
- Produces: All tables in `aicorelink` database

```bash
# On local machine (or CI), with DATABASE_URL set to the VPS connection string:
cd apps/dashboard

# Set the DATABASE_URL for the VPS database
export AICORELINK_DATABASE_URL="postgresql://aicorelink_app:PASSWORD@HOST_POSTGRES_INTERNO:5432/aicorelink"

# Generate Prisma client
npx prisma generate

# Create and run initial migration
npx prisma migrate dev --name init

# Verify tables created
npx prisma db pull
```

- [ ] **Step 2.1:** Set `AICORELINK_DATABASE_URL` env var with VPS connection string
- [ ] **Step 2.2:** Run `npx prisma generate`
- [ ] **Step 2.3:** Run `npx prisma migrate dev --name init`
- [ ] **Step 2.4:** Verify tables: `conversations`, `messages`, `tenants`, `tenant_users`, `tenant_channels`, `channel_credentials`, `tenant_usage`, `audit_log`, `cost_rates`

---

### Task 3: Apply RLS Policies

**Files:**
- `apps/dashboard/prisma/rls.sql` (already exists with policies for all tables including conversations/messages)

```bash
# On local machine with same DATABASE_URL:
psql "$AICORELINK_DATABASE_URL" -f apps/dashboard/prisma/rls.sql

# Verify policies applied:
psql "$AICORELINK_DATABASE_URL" -c "\dp"
```

- [ ] **Step 3.1:** Run `psql "$AICORELINK_DATABASE_URL" -f apps/dashboard/prisma/rls.sql`
- [ ] **Step 3.2:** Verify policies exist on all tables with `\dp`

---

### Task 4: Create Seed Data

**Files:**
- Create seed script: `apps/dashboard/prisma/seed.ts`

**Interfaces:**
- Consumes: Database with tables + RLS from Tasks 2-3
- Produces: Tenant, User, TenantUser (dev_aicore), TenantChannel (whatsapp_text enabled), basic cost_rates

```typescript
// apps/dashboard/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // 1. Create tenant
  const tenant = await db.tenant.upsert({
    where: { slug: "clinica-demo" },
    update: {},
    create: {
      name: "Clínica Demo",
      slug: "clinica-demo",
      plan: "pro",
      status: "activo",
    },
  });

  // 2. Create dev_aicore user
  const passwordHash = await hash("dev123456", 12);
  const user = await db.user.upsert({
    where: { email: "dev@aicore.com" },
    update: {},
    create: {
      email: "dev@aicore.com",
      passwordHash,
    },
  });

  // 3. Link user to tenant as dev_aicore
  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role: "dev_aicore" },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "dev_aicore",
    },
  });

  // 4. Enable whatsapp_text channel for tenant
  await db.tenantChannel.upsert({
    where: { tenantId_channel: { tenantId: tenant.id, channel: "whatsapp_text" } },
    update: { enabled: true, config: { tone: "amable", autoReplyEnabled: true } },
    create: {
      tenantId: tenant.id,
      channel: "whatsapp_text",
      enabled: true,
      config: { tone: "amable", autoReplyEnabled: true },
    },
  });

  // 5. Add basic cost_rates
  await db.costRate.upsert({
    where: { id: "openrouter-tokens" },
    update: { rate: 0.000001, provider: "openrouter", unit: "token" },
    create: { id: "openrouter-tokens", provider: "openrouter", unit: "token", rate: 0.000001 },
  });
  await db.costRate.upsert({
    where: { id: "meta-messages" },
    update: { rate: 0.005, provider: "meta_cloud_api", unit: "message" },
    create: { id: "meta-messages", provider: "meta_cloud_api", unit: "message", rate: 0.005 },
  });

  console.log("Seed completed:", { tenant: tenant.slug, user: user.email });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
```

```bash
# Run seed:
cd apps/dashboard
npx tsx prisma/seed.ts
```

- [ ] **Step 4.1:** Create `apps/dashboard/prisma/seed.ts` with the content above
- [ ] **Step 4.2:** Install tsx if needed: `npm install -D tsx`
- [ ] **Step 4.3:** Run `npx tsx prisma/seed.ts`
- [ ] **Step 4.4:** Verify data: `psql "$AICORELINK_DATABASE_URL" -c "SELECT * FROM tenants; SELECT * FROM tenant_users; SELECT * FROM tenant_channels;"`

---

### Task 5: Configure Dokploy Environment Variables

**Files:**
- Dokploy UI: https://dokploy.aicorebots.com → Service `aicorelink-aicorelink-b7m7ol` → Environment Variables

**Required variables to set in Dokploy (all at once):**

| Variable | Value | Notes |
|----------|-------|-------|
| `AICORELINK_DATABASE_URL` | `postgresql://aicorelink_app:PASSWORD@HOST_POSTGRES_INTERNO:5432/aicorelink` | From Task 1 |
| `AICORELINK_NEXTAUTH_SECRET` | `openssl rand -base64 32` | Generate new |
| `AICORELINK_NEXTAUTH_URL` | `https://AicoreLink.aicorebots.com` | |
| `NEXTAUTH_URL` | `https://AicoreLink.aicorebots.com` | Duplicate for NextAuth internals |
| `AICORELINK_ENCRYPTION_KEY` | `openssl rand -base64 32` | Generate new, 32 chars base64 |
| `AICORELINK_BILLING_WEBHOOK_SECRET` | (optional) | Placeholder |
| `AICORELINK_META_CLOUD_API_TOKEN` | (from Meta) | Fase 1 - can leave empty for now |
| `AICORELINK_META_VERIFY_TOKEN` | (your choice) | Fase 1 - webhook verification |
| `AICORELINK_META_APP_SECRET` | (from Meta) | Fase 1 - signature verification |
| `AICORELINK_OPENROUTER_API_KEY` | (from OpenRouter) | Fase 1 - can leave empty, falls back to Ollama |
| `AICORELINK_OLLAMA_BASE_URL` | `http://172.18.0.1:11434` | Internal Docker network |
| `AICORELINK_N8N_WHATSAPP_WEBHOOK_URL` | (n8n webhook URL) | Fase 1 - leave empty for now |
| `AICORELINK_WHISPER_URL` | `http://172.18.0.1:9000` | Fase 2 - leave empty for now |
| `AICORELINK_ELEVENLABS_API_KEY` | (from ElevenLabs) | Fase 2 - leave empty for now |
| `AICORELINK_ELEVENLABS_VOICE_ID` | `21m00Tcm4TlvDq8ikWAM` | Default |

- [ ] **Step 5.1:** Open Dokploy: https://dokploy.aicorebots.com
- [ ] **Step 5.2:** Go to Service `aicorelink-aicorelink-b7m7ol` → Environment Variables
- [ ] **Step 5.3:** Add ALL variables from table above (minimum required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ENCRYPTION_KEY)
- [ ] **Step 5.4:** Save and trigger redeploy

---

### Task 6: Redeploy on Dokploy and Verify

```bash
# In Dokploy UI:
# 1. Service aicorelink-aicorelink-b7m7ol → Deploy → "Deploy" button
# 2. Wait for build to complete (should pass - already verified)
# 3. Check runtime logs for errors

# Verification:
# 1. Visit https://AicoreLink.aicorebots.com
# 2. Should see login page
# 3. Login with: dev@aicore.com / dev123456
# 4. Should see dashboard with metrics
# 5. Navigate to /whatsapp (cliente panel) - should show WhatsApp config (toggle off by default)
```

- [ ] **Step 6.1:** Trigger deploy in Dokploy
- [ ] **Step 6.2:** Monitor build logs for success
- [ ] **Step 6.3:** Monitor runtime logs for any errors
- [ ] **Step 6.4:** Visit https://AicoreLink.aicorebots.com and verify login works
- [ ] **Step 6.5:** Verify dashboard shows data (tenant_usage, etc.)
- [ ] **Step 6.6:** Verify `/whatsapp` page loads (cliente panel)

---

## Verification Checklist

After all tasks complete:

- [ ] Database `aicorelink` exists on VPS PostgreSQL
- [ ] All Prisma tables created (10 tables)
- [ ] RLS policies active on all 10 tables
- [ ] Seed data: tenant `clinica-demo`, user `dev@aicore.com`, channel `whatsapp_text` enabled
- [ ] Dokploy env vars configured (min: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ENCRYPTION_KEY)
- [ ] Dokploy deploy successful (build + runtime)
- [ ] https://AicoreLink.aicorebots.com loads login page
- [ ] Login works with dev@aicore.com / dev123456
- [ ] Dashboard shows metrics
- [ ] `/whatsapp` page accessible (cliente panel)

---

## Next Steps After This Plan

Once deployment works:

1. **Fase 1 Implementation** - WhatsApp Texto (spec exists at `docs/superpowers/specs/2026-08-25-fase1-whatsapp-texto-design.md`)
2. **Fase 3 Implementation** - Email IA (spec exists at `docs/superpowers/specs/2026-08-25-fase3-email-ia-design.md`)
3. **Fase 4 Implementation** - RRSS (design confirmed in compressed history)

Use `writing-plans` skill for each phase implementation.