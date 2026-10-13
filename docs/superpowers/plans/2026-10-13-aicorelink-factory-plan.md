# AicoreLink E2 — Fábrica de Sitios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the multi-tenant site factory that produces a client site in 48–72h: business profiles, 3-rubro templates (3/5/10 pages), AI generator with anti-invention guardrails, internal review panel (preview, checklist, approval, versioning), and one-click publishing to subdomain/custom domain with auto-CNAME+TLS.

**Architecture:** Extends the existing multi-tenant Prisma schema with Site/Page/Template/BusinessProfile models. AI generation runs via n8n workflows + Ollama/OpenRouter with strict grounding (only business profile data, mark unknowns as TODO). Admin review UI in `(admin)/fabrica`. Publishing uses Traefik dynamic config + Let's Encrypt via existing Dokploy/Traefik setup on VPS.

**Tech Stack:** Next.js 14 App Router + TS + Prisma 5 + PostgreSQL (RLS), n8n self-hosted + Ollama (Mistral) + OpenRouter (GLM), Tailwind, Zod, Vitest + Playwright. Existing: `withTenant()`, `lib/ai/router`, `lib/demos/knowledge` guardrails, `lib/leads` patterns.

**Spec:** `docs/superpowers/specs/2026-10-11-aicorelink-saas-redesign-design.md` (SRD M4, M5, M9) + master plan `docs/superpowers/plans/2026-10-12-aicorelink-web-master-build-plan.md` §4 E2 (lines 143–148). Source: `AicoreLink_Web_Plan_de_Ejecucion.md` Plan P3.1–P3.6.

---

## Global Constraints

- Quality before commit: `npm run lint` + `npm run typecheck` + `npm run test` green (in `apps/dashboard`).
- Multi-tenancy: all tenant data queries via `withTenant()` (RLS). App role never has `BYPASSRLS`.
- Add tenant = DATA (insert rows), never code. No branches/deploys per client.
- All external input validated with **Zod** (forms, webhooks, APIs).
- Secrets: never commit `.env`; env names without prefix.
- Copy: **Chilean tuteo**, NEVER voseo; no unexplained jargon; AI never invents prices/hours/promises.
- Code/identifiers/comments in **English**; UI copy in Spanish.
- Prices in CLP with IVA indicated separately.
- Conventional commits in English, no AI attribution.
- Human in the loop: no client site published without human checklist review.

---

## Review Focus (5 failure modes)

1. **RLS isolation** — a tenant sees another tenant's site/pages/data. Test in E2 (RN-04).
2. **AI invents data** — generator fabricates phone, address, prices, team. Guardrail test in generator task.
3. **Publishing race** — two publishes for same site stomp each other; CNAME/TLS mismatch. Test in publish task.
4. **Template drift** — template changes don't propagate to existing sites, or do unintentionally. Versioning test.
5. **Cost overrun** — AI generation tokens unbounded. Cap + alert in generation task.

---

## File Structure (new / modified)

| File | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | + `BusinessProfile`, `Site`, `SitePage`, `SiteTemplate`, `SiteVersion`, `PublishLog` |
| `lib/factory/business-profile.ts` | Zod schema + CRUD for business profile (form + WhatsApp file intake) |
| `lib/factory/templates.ts` | 3 rubro templates (barberia, taller, profesional) — 3/5/10 page structures with variables |
| `lib/factory/generator.ts` | AI generator: prompt builder, anti-invention (grounding), token cap, returns `SiteDraft` |
| `lib/factory/publisher.ts` | Publish to subdomain (`{slug}.aicorelink.aicorebots.com`) + custom domain (CNAME + ACME TLS) |
| `lib/factory/versioning.ts` | Site versioning + diff + rollback |
| `app/(admin)/fabrica/page.tsx` | Admin dashboard: list sites, status, actions |
| `app/(admin)/fabrica/[siteId]/page.tsx` | Site detail: preview, checklist, approve/reject, version history |
| `app/(admin)/fabrica/new/page.tsx` | Create site from profile + template |
| `app/api/factory/sites/route.ts` | CRUD sites (admin) |
| `app/api/factory/sites/[id]/generate/route.ts` | Trigger AI generation (async via n8n) |
| `app/api/factory/sites/[id]/publish/route.ts` | Publish/unpublish endpoint |
| `app/api/factory/sites/[id]/versions/route.ts` | Version history + rollback |
| `n8n-workflows/factory-generate.json` | n8n workflow: receive profile → call generator → store draft |
| `n8n-workflows/factory-publish.json` | n8n workflow: deploy static files → configure Traefik → verify DNS/TLS |
| `__tests__/lib/factory/*.test.ts` | Unit tests for schemas, generator, publisher, versioning |
| `__tests__/app/api/factory/*.test.ts` | API route tests (mock n8n) |
| `e2e/factory.spec.ts` | Playwright: create site → generate → review → publish → verify live |

---

## Tasks

### Task E2.1: Prisma Schema + Migration (Multi-tenant Site Models)

**Files:**
- Modify: `apps/dashboard/prisma/schema.prisma`
- Create: `apps/dashboard/prisma/migrations/20261013_add_factory_models/migration.sql`
- Test: `apps/dashboard/__tests__/lib/factory/schema.test.ts`

**Interfaces:**
- Produces: `BusinessProfile`, `Site`, `SitePage`, `SiteTemplate`, `SiteVersion`, `PublishLog` models with `tenantId` + RLS policies

- [ ] **Step 1: Write failing test** — assert models exist, have `tenantId`, unique constraints, relations
- [ ] **Step 2: Run test → FAIL**
- [ ] **Step 3: Implement models in `schema.prisma`** — see spec below
- [ ] **Step 4: Generate migration SQL** — `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql`
- [ ] **Step 5: Run migration locally** — `npx prisma migrate deploy`
- [ ] **Step 6: Run tests → PASS**
- [ ] **Step 7: Commit** — `feat(factory): add multi-tenant site models (BusinessProfile, Site, SitePage, SiteTemplate, SiteVersion, PublishLog)`

**Model Spec (add to schema.prisma):**

```prisma
model BusinessProfile {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  rubro       String   // barberia | taller | profesional | clinica | inmobiliaria | domicilio
  name        String
  slug        String   @unique @map("slug")
  phone       String?
  email       String?
  address     String?
  description String?  @db.Text
  logoUrl     String?  @map("logo_url")
  images      String[] @default([]) @map("images")
  hours       Json     @default("{}") // { lunes: {open, close}, ... }
  team        Json     @default("[]") // [{name, role, bio, photoUrl}]
  services    Json     @default("[]") // [{name, description, priceCLP?, durationMin}]
  faqs        Json     @default("[]") // [{question, answer}]
  social      Json     @default("{}") // {instagram, facebook, tiktok, web}
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  site        Site?

  @@map("business_profiles")
}

model Site {
  id            String   @id @default(uuid())
  tenantId      String   @map("tenant_id")
  businessProfileId String? @unique @map("business_profile_id")
  templateId    String   @map("template_id")
  name          String
  subdomain     String   @unique @map("subdomain") // e.g., "peluqueria-maria"
  customDomain  String?  @unique @map("custom_domain")
  status        String   @default("draft") // draft | generating | review | approved | published | unpublished
  currentVersionId String? @map("current_version_id")
  publishedAt   DateTime? @map("published_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  businessProfile BusinessProfile? @relation(fields: [businessProfileId], references: [id])
  template      SiteTemplate @relation(fields: [templateId], references: [id])
  pages         SitePage[]
  versions      SiteVersion[]
  publishLogs   PublishLog[]

  @@index([tenantId])
  @@index([status])
  @@map("sites")
}

model SitePage {
  id        String   @id @default(uuid())
  siteId    String   @map("site_id")
  templatePageId String? @map("template_page_id")
  path      String   // e.g., "/", "/servicios", "/equipo", "/contacto", "/reservar"
  title     String
  content   Json     // { blocks: [...] } — portable content (not HTML)
  meta      Json     @default("{}") // {title, description, ogImage, noindex}
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([siteId, path])
  @@map("site_pages")
}

model SiteTemplate {
  id          String   @id @default(uuid())
  rubro       String   @unique // barberia | taller | profesional
  name        String
  planTier    String   // starter | growth | elite
  pageCount   Int      // 3, 5, or 10
  structure   Json     // [{path, title, blocksTemplate, requiredVariables}]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  sites       Site[]
  pages       SiteTemplatePage[]

  @@map("site_templates")
}

model SiteTemplatePage {
  id            String   @id @default(uuid())
  templateId    String   @map("template_id")
  path          String
  title         String
  blocksTemplate Json    // template with {{variable}} placeholders
  requiredVariables String[] @map("required_variables")
  order         Int      @default(0)

  template      SiteTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([templateId, path])
  @@map("site_template_pages")
}

model SiteVersion {
  id        String   @id @default(uuid())
  siteId    String   @map("site_id")
  version   Int
  pages     Json     // full snapshot of pages at this version
  changelog String?  @map("changelog")
  createdBy String   @map("created_by") // userId
  createdAt DateTime @default(now()) @map("created_at")

  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([siteId, version])
  @@map("site_versions")
}

model PublishLog {
  id          String   @id @default(uuid())
  siteId      String   @map("site_id")
  version     Int
  action      String   // publish | unpublish | rollback | domain_change
  target      String   // subdomain or custom domain
  status      String   // success | failed | pending
  error       String?  @db.Text
  meta        Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")

  site        Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@map("publish_logs")
}
```

**RLS Policies (add to migration SQL):**
```sql
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_profiles_tenant ON business_profiles USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY sites_tenant ON sites USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY site_pages_tenant ON site_pages USING (site_id IN (SELECT id FROM sites WHERE tenant_id = current_setting('app.current_tenant')::uuid));
CREATE POLICY site_versions_tenant ON site_versions USING (site_id IN (SELECT id FROM sites WHERE tenant_id = current_setting('app.current_tenant')::uuid));
CREATE POLICY publish_logs_tenant ON publish_logs USING (site_id IN (SELECT id FROM sites WHERE tenant_id = current_setting('app.current_tenant')::uuid));
```

---

### Task E2.2: Business Profile CRUD + Intake Form (WhatsApp + Web)

**Files:**
- Create: `apps/dashboard/lib/factory/business-profile.ts`
- Create: `apps/dashboard/lib/factory/business-profile.test.ts`
- Create: `apps/dashboard/components/factory/business-profile-form.tsx`
- Create: `apps/dashboard/app/(admin)/fabrica/new/page.tsx`
- Test: `apps/dashboard/__tests__/lib/factory/business-profile.test.ts`

**Interfaces:**
- Consumes: `withTenant()`, `Tenant` from auth
- Produces: `createBusinessProfile(data, tenantId)`, `getBusinessProfile(tenantId)`, `updateBusinessProfile(id, data, tenantId)`

- [ ] **Step 1: Write failing tests** — create/get/update, Zod validation, tenant isolation
- [ ] **Step 2: Run tests → FAIL**
- [ ] **Step 3: Implement `lib/factory/business-profile.ts`** — Zod schema (rubro enum, phone regex, email, arrays for images/team/services/faqs), CRUD with `withTenant()`
- [ ] **Step 4: Build intake form component** — multi-step: basic info → location/hours → team/services → FAQs → files (logo, photos via upload to `/tmp` + WhatsApp forward)
- [ ] **Step 5: Create admin page `/fabrica/new`** — uses form, on submit creates `BusinessProfile` + `Site` (draft) → redirects to `/fabrica/[siteId]`
- [ ] **Step 6: Run tests → PASS**
- [ ] **Step 7: Commit** — `feat(factory): business profile intake form and CRUD`

---

### Task E2.3: 3 Rubro Templates (Barbería, Taller, Profesional) — 3/5/10 Pages

**Files:**
- Create: `apps/dashboard/lib/factory/templates.ts`
- Create: `apps/dashboard/lib/factory/templates.test.ts`
- Create: `apps/dashboard/prisma/seed-templates.ts` (run once)
- Test: `apps/dashboard/__tests__/lib/factory/templates.test.ts`

**Interfaces:**
- Consumes: Prisma `SiteTemplate`, `SiteTemplatePage`
- Produces: `getTemplatesByRubro(rubro)`, `getTemplatePages(templateId)`, `seedTemplates()`

- [ ] **Step 1: Write failing tests** — 3 templates exist, correct page counts (3/5/10), required variables per page
- [ ] **Step 2: Run tests → FAIL**
- [ ] **Step 3: Implement `templates.ts`** — hardcoded template definitions (see spec below) + `seedTemplates()` for Prisma seed
- [ ] **Step 4: Run seed** — `npx tsx prisma/seed-templates.ts`
- [ ] **Step 5: Run tests → PASS**
- [ ] **Step 6: Commit** — `feat(factory): add 3 rubro templates (barberia/taller/profesional) with 3/5/10 pages`

**Template Spec (per rubro, per plan tier):**

| Rubro | Starter (3 páginas) | Growth (5 páginas) | Elite (10 páginas) |
|-------|---------------------|---------------------|---------------------|
| **Barbería** | Inicio, Servicios, Contacto | + Equipo, Reservar | + Blog, Galería, Promos, FAQ, Reseñas |
| **Taller** | Inicio, Servicios, Contacto | + Equipo, Reservar | + Blog, Galería, Promos, FAQ, Reseñas |
| **Profesional** | Inicio, Servicios, Contacto | + Equipo, Agendar | + Blog, Casos, FAQ, Reseñas, Recursos |

**Required variables per template** (grounding for generator): `businessName`, `tagline`, `phone`, `email`, `address`, `hours`, `services[]`, `team[]`, `faqs[]`, `logoUrl`, `images[]`, `social{}`, `description`.

---

### Task E2.4: AI Generator with Anti-Invention Guardrails

**Files:**
- Create: `apps/dashboard/lib/factory/generator.ts`
- Create: `apps/dashboard/lib/factory/generator.test.ts`
- Create: `apps/dashboard/app/api/factory/sites/[id]/generate/route.ts`
- Create: `apps/dashboard/__tests__/app/api/factory/generate.test.ts`
- Create: `n8n-workflows/factory-generate.json`

**Interfaces:**
- Consumes: `BusinessProfile`, `SiteTemplate`, `lib/ai/router.generateResponse`, `lib/demos/knowledge.applyGuardrails`
- Produces: `generateSiteDraft(siteId, tenantId) → SiteDraft { pages: SitePageDraft[] }`

- [ ] **Step 1: Write failing tests** — generator uses ONLY profile data; any unknown → `{{TODO: ...}}` placeholder; token cap enforced; price/hours/phone never invented
- [ ] **Step 2: Run tests → FAIL**
- [ ] **Step 3: Implement `generator.ts`** — for each template page: build prompt with profile JSON + template blocks; call `generateResponse(..., useOpenRouter: tier===elite)`; post-process with `applyGuardrails`; enforce maxTokens ≤ 800 per page; return structured `SiteDraft`
- [ ] **Step 4: API route** — `POST /api/factory/sites/[id]/generate` → validates site belongs to tenant, status=draft, triggers n8n webhook (async), returns `{jobId, status: "generating"}`
- [ ] **Step 5: n8n workflow** — webhook → call generator API (or inline) → write draft pages to DB → update site status → notify admin
- [ ] **Step 6: Run tests → PASS** (mock AI calls)
- [ ] **Step 7: Commit** — `feat(factory): AI site generator with anti-invention guardrails`

**Guardrail Rules (hard):**
- If profile field missing → output `{{TODO: fieldName}}` (never invent)
- Phone/email/address: only from profile
- Prices: only from `services[].priceCLP`; if missing → `{{TODO: price}}`
- Team names/roles: only from profile
- Hours: only from profile
- Token cap: 800/page, 4000 total per generation

---

### Task E2.5: Internal Review Panel (Preview + Checklist + Approval + Versioning)

**Files:**
- Create: `apps/dashboard/lib/factory/versioning.ts`
- Create: `apps/dashboard/lib/factory/versioning.test.ts`
- Create: `apps/dashboard/app/(admin)/fabrica/[siteId]/page.tsx`
- Create: `apps/dashboard/app/api/factory/sites/[id]/versions/route.ts`
- Create: `apps/dashboard/__tests__/lib/factory/versioning.test.ts`
- Create: `apps/dashboard/__tests__/app/api/factory/versions.test.ts`

**Interfaces:**
- Consumes: `Site`, `SitePage`, `SiteVersion`
- Produces: `createVersion(siteId, changelog, userId)`, `getVersions(siteId)`, `rollback(siteId, version)`, `diffVersions(v1, v2)`

- [ ] **Step 1: Write failing tests** — version created on generate; diff shows changes; rollback restores pages; approval gates publish
- [ ] **Step 2: Run tests → FAIL**
- [ ] **Step 3: Implement `versioning.ts`** — snapshot all pages as JSON; semantic diff (added/removed/modified blocks); rollback = restore snapshot
- [ ] **Step 4: Admin UI page** — left: site info + status badge; center: page tabs with live preview (iframe or component render); right: checklist (copy complete, images present, prices valid, links work, SEO meta, mobile ok) + approve/reject buttons; bottom: version history with diff + rollback
- [ ] **Step 5: API routes** — `GET/POST /api/factory/sites/[id]/versions`, `POST /api/factory/sites/[id]/versions/[v]/rollback`
- [ ] **Step 6: Run tests → PASS**
- [ ] **Step 7: Commit** — `feat(factory): internal review panel with preview, checklist, approval, versioning`

---

### Task E2.6: Publishing (Subdomain + Custom Domain + Auto TLS)

**Files:**
- Create: `apps/dashboard/lib/factory/publisher.ts`
- Create: `apps/dashboard/lib/factory/publisher.test.ts`
- Create: `apps/dashboard/app/api/factory/sites/[id]/publish/route.ts`
- Create: `apps/dashboard/__tests__/lib/factory/publisher.test.ts`
- Create: `n8n-workflows/factory-publish.json`

**Interfaces:**
- Consumes: `Site`, `SiteVersion`, Traefik dynamic config API (or file watch), ACME (Let's Encrypt)
- Produces: `publishSite(siteId, version, target: 'subdomain'|'custom') → PublishLog`, `unpublishSite(siteId)`

- [ ] **Step 1: Write failing tests** — publish creates DNS-ready config, TLS cert obtained, health check passes; rollback works; concurrent publishes serialized
- [ ] **Step 2: Run tests → FAIL**
- [ ] **Step 3: Implement `publisher.ts`** — subdomain: write Traefik dynamic config rule `Host({subdomain}.aicorelink.aicorebots.com)` → service; custom domain: verify CNAME → request LE cert via Traefik ACME → update config; both: deploy static files to `sites/{tenantId}/{siteId}/` on VPS; health check `GET /` returns 200
- [ ] **Step 4: API route** — `POST /api/factory/sites/[id]/publish` (body: `{version, target, customDomain?}`) → validates approval, triggers n8n publish workflow
- [ ] **Step 5: n8n workflow** — receives publish job → calls publisher → verifies DNS/TLS → updates site status + publishedAt → logs PublishLog
- [ ] **Step 6: Run tests → PASS** (mock Traefik/ACME)
- [ ] **Step 7: Commit** — `feat(factory): publish to subdomain/custom domain with auto TLS`

---

### Task E2.7: Admin Factory Dashboard + E2E Test

**Files:**
- Create: `apps/dashboard/app/(admin)/fabrica/page.tsx`
- Create: `apps/dashboard/e2e/factory.spec.ts`

**Interfaces:**
- Consumes: all factory APIs
- Produces: dashboard listing with filters (status, rubro, tenant), bulk actions

- [ ] **Step 1: Write failing e2e test** — create profile → new site → generate → review → approve → publish → verify live URL → rollback
- [ ] **Step 2: Run test → FAIL**
- [ ] **Step 3: Implement dashboard page** — table with columns: site, rubro, plan, status, version, last publish, actions
- [ ] **Step 4: Wire all factory routes in admin layout sidebar**
- [ ] **Step 5: Run e2e test → PASS** (3 viewports)
- [ ] **Step 6: Commit** — `feat(factory): admin dashboard and full e2e funnel`

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-10-13-aicorelink-factory-plan.md`.**

**Recommended execution: Subagent-driven** — because:
- 7 tightly coupled tasks with shared interfaces (generator → review → publish)
- RLS isolation (RN-04) is critical and must be verified per task
- AI guardrails are high-risk (invented data = broken trust)
- A shipped mistake in publishing breaks live client sites

**Does the plan capture what you want, and shall we proceed with subagent-driven?**