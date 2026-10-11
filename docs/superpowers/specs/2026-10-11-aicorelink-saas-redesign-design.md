# Spec: AicoreLink — SaaS de Sitios Web con IA para Negocios Locales

## Objective

**Qué estamos construyendo:** Transformar AicoreLink de un dashboard interno multi-tenant a una **plataforma SaaS B2B** que vende sitios web con IA "llave en mano" para negocios locales, con modelo de suscripción mensual que incluye hosting, WhatsApp, IA y mantenimiento.

**Usuario objetivo:** Dueños de negocios locales (clínicas, gimnasios, restaurantes, inmobiliarias, talleres, salones de belleza, profesionales independientes) que:
- Pierden clientes por no contestar mensajes a tiempo
- No tienen web o tienen una web estática que no convierte
- No pueden pagar desarrollo custom caro ni mantenerla
- Quieren automatizar atención y captación 24/7

**Dolores que resolvemos:**
1. **Pérdida de clientes por respuesta lenta** → Chat IA 24/7 + WhatsApp Business
2. **Web que no convierte** → Embudo de ventas optimizado (landing + formulario + calendario + reseñas)
3. **Costos técnicos ocultos** → Precio único mensual todo incluido (hosting + WhatsApp + IA + mantenimiento)
4. **Falta de tiempo para gestionar** → Automatización total + panel simple
5. **No aparecen en Google/Mapas** → SEO local + reseñas automáticas + ficha Google Business

**Planes de suscripción:**

| Plan | Páginas | Formulario | Chat IA | Calendario | Reseñas Auto | Voz IA | Precio/mes* |
|------|---------|------------|---------|------------|--------------|--------|-------------|
| **Starter** | 3 | Básico | Básico (texto) | ❌ | ❌ | ❌ | $49-79 USD |
| **Growth** | 5 | Avanzado | Pro (texto + intents) | ✅ | ✅ | ❌ | $99-149 USD |
| **Elite** | 10 | Premium | Pro + Voz (recepcionista) | ✅ | ✅ | ✅ | $199-299 USD |

*Precio final por definir; setup fee $0 o mínimo ($99-199) según plan

**Éxito =** 10 clientes pagando en 60 días, churn < 5% mensual, LTV > 6 meses, CAC < primer mes de suscripción.

---

## Tech Stack

**Frontend (Marketing Site + Client Portal):**
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Server Components por defecto, Client Components solo para interactividad
- Framer Motion para animaciones sutiles
- React Hook Form + Zod para formularios
- NextAuth v4 (Credentials + JWT) para portal clientes

**Backend (API + Portal + Webhooks):**
- Next.js Route Handlers (`app/api/...`)
- Prisma ORM + PostgreSQL (multi-tenant con RLS)
- NextAuth para auth, webhook handlers para Meta/WhatsApp, n8n, Stripe
- n8n (self-hosted en VPS) para orquestación de IA y flujos conversacionales
- Ollama (Mistral/Gemma local) + OpenRouter (GLM/cloud) para IA
- Meta Cloud API (WhatsApp Business) + ElevenLabs (TTS) + Whisper (STT)

**Infraestructura:**
- VPS única (51.222.207.250) con Dokploy (Docker Swarm + Traefik)
- PostgreSQL compartida, BD `aicorelink` con RLS por tenant
- Dominio: `aicorelink.aicorebots.com` (marketing) + subdominios por cliente (`cliente.aicorelink.aicorebots.com`)
- SSL automático (Let's Encrypt via Traefik)
- CI/CD: GitHub Actions → ghcr.io → Dokploy deploy

**Pagos:**
- Stripe (suscripciones + setup fees + usage-based para WhatsApp/IA overages)
- Webhook Stripe → activar tenant + provisionar subdominio + configurar n8n

---

## Commands

```bash
# Desarrollo
npm run dev                    # Next.js dev server (puerto 3000)
npm run dev:docker             # Docker compose local (opcional)

# Base de datos
npx prisma migrate dev         # Nueva migración en dev
npx prisma migrate deploy      # Aplicar migraciones en prod
npx prisma generate            # Generar cliente Prisma
npx prisma studio              # UI para inspeccionar BD
psql "$DATABASE_URL" -f apps/dashboard/prisma/rls.sql  # Aplicar RLS

# Calidad
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run test                   # Jest + React Testing Library
npm run test:e2e               # Playwright

# Build & Deploy
docker build -t aicorelink -f apps/dashboard/Dockerfile apps/dashboard
# Deploy vía GitHub Actions (push a main) → Dokploy auto-deploy

# Utilidades
node -e "console.log(require('bcryptjs').hashSync('password', 10))"  # Hash password
openssl rand -base64 32        # Generar NEXTAUTH_SECRET
```

---

## Project Structure

```
AicoreLink/
├── apps/
│   └── dashboard/                    # Next.js 14 App Router (marketing + portal + api)
│       ├── app/
│       │   ├── (marketing)/          # Rutas públicas de venta
│       │   │   ├── layout.tsx        # Layout marketing (header minimal, footer)
│       │   │   ├── page.tsx          # Hero + planes + dolores + FAQ + CTA
│       │   │   ├── planes/           # Detalle de planes + comparación
│       │   │   ├── casos-de-exito/   # Testimonios + demos
│       │   │   ├── blog/             # Contenido SEO (opcional fase 2)
│       │   │   └── componentes/      # Componentes reutilizables marketing
│       │   │
│       │   ├── (portal)/             # Portal cliente (auth required)
│       │   │   ├── layout.tsx        # Sidebar navegación tenant
│       │   │   ├── dashboard/        # Resumen métricas + leads
│       │   │   ├── whatsapp/         # Config canal WhatsApp + IA
│       │   │   ├── sitio/            # Editor visual de su sitio (fase 2)
│       │   │   ├── leads/            # CRM simple: leads, conversaciones
│       │   │   ├── facturacion/      # Historial Stripe + facturas
│       │   │   └── configuracion/    # Perfil, team, notificaciones
│       │   │
│       │   ├── api/
│       │   │   ├── auth/             # NextAuth endpoints
│       │   │   ├── webhooks/
│       │   │   │   ├── whatsapp/     # Meta webhook entrante
│       │   │   │   ├── n8n/          # n8n callback con clasificación
│       │   │   │   ├── stripe/       # Stripe events (subscriptions, invoices)
│       │   │   │   └── whisper/      # Callback transcripción (opcional)
│       │   │   ├── tenants/          # CRUD tenants (admin only)
│       │   │   ├── channels/         # Config canales por tenant
│       │   │   ├── leads/            # API leads + conversaciones
│       │   │   ├── sites/            # API gestión sitio (fase 2)
│       │   │   └── usage/            # Métricas uso + billing
│       │   │
│       │   ├── login/                # Login page
│       │   ├── register/             # Registro + checkout Stripe
│       │   ├── globals.css
│       │   ├── layout.tsx            # Root layout
│       │   └── page.tsx              # Redirect según auth
│       │
│       ├── lib/
│       │   ├── auth.ts               # NextAuth config
│       │   ├── db.ts                 # Prisma singleton
│       │   ├── tenant-context.ts     # withTenant() + asAdmin()
│       │   ├── rbac.ts               # Roles: admin | cliente | dev_aicore
│       │   ├── entitlements.ts       # hasFeature(tenantId, feature)
│       │   ├── ai/                   # Ollama + OpenRouter clients
│       │   ├── whatsapp/             # Meta API + signature verify
│       │   ├── voice/                # ElevenLabs TTS + Whisper STT
│       │   ├── billing/              # Stripe helpers
│       │   ├── sites/                # Site builder helpers (fase 2)
│       │   ├── audit.ts              # Audit log helpers
│       │   └── utils.ts              # Helpers genéricos
│       │
│       ├── prisma/
│       │   ├── schema.prisma         # Modelo multi-tenant + planes + suscripciones
│       │   ├── rls.sql               # Políticas RLS
│       │   └── seed.ts               # Seed demo + planes
│       │
│       ├── components/
│       │   ├── ui/                   # Primitivos (Button, Card, Input, Modal, etc.)
│       │   ├── marketing/            # Hero, PricingTable, FeatureGrid, Testimonial, FAQ
│       │   ├── portal/               # Sidebar, Header, MetricCard, LeadTable, ChatConfig
│       │   └── forms/                # FormField, Select, Checkbox, Textarea
│       │
│       ├── public/
│       ├── styles/
│       ├── Dockerfile
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .opencode/
│   ├── skills/                       # Skills personalizadas (backend, frontend, etc.)
│   └── memory/                       # project.md + session-log.md
│
├── n8n-workflows/                    # Workflows n8n versionados
│   ├── whatsapp-text.json
│   ├── whatsapp-voice.json
│   ├── lead-capture.json
│   └── review-automation.json
│
├── docs/
│   └── superpowers/
│       ├── specs/                    # Specs (este archivo)
│       └── plans/                    # Planes de implementación
│
├── .gitignore
├── README.md
└── docker-compose.yml (referencia)
```

---

## Code Style

**Convenciones clave (ya establecidas en skills):**

```tsx
// Server Component fetching data (force-dynamic)
export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await asAdmin((tx) =>
    tx.tenant.findMany({ orderBy: { createdAt: "desc" } })
  );
  return <TenantsTable tenants={tenants} />;
}

// Client Component solo para interactividad
"use client";
import { useState } from "react";

export function WhatsappConfig() {
  const [config, setConfig] = useState(defaultConfig);
  // ...
}

// Tailwind: usar tokens definidos en tailwind.config.ts
// Colores: bg-navy, bg-brand, bg-slate-50, text-teal, text-brand
// Tablas: overflow-hidden rounded-lg border border-slate-200 bg-white
// Botones primarios: bg-brand text-white hover:bg-brand-dark
```

**Naming:**
- Archivos: kebab-case (`whatsapp-config.tsx`)
- Componentes: PascalCase (`WhatsappConfig`)
- Hooks: camelCase con prefijo `use` (`useTenant`)
- API routes: kebab-case en carpetas (`app/api/webhooks/whatsapp/route.ts`)

**TypeScript:** Strict mode, no `any`, interfaces para props, `Prisma.InputJsonValue` para JSON.

---

## Testing Strategy

| Nivel | Framework | Ubicación | Qué testea |
|-------|-----------|-----------|------------|
| Unit | Jest + RTL | `__tests__/unit/` | Utils, helpers, hooks, componentes UI aislados |
| Integration | Jest + RTL | `__tests__/integration/` | API routes, Prisma queries, auth flow, webhooks |
| E2E | Playwright | `e2e/` | Flujos críticos: signup → checkout → portal → config WhatsApp → recibir mensaje |

**Cobertura objetivo:** 80% unit/integration, 100% flujos críticos E2E.

**Datos de test:** Factories con `@faker-js/faker` + BD de test separada (Docker compose).

---

## Boundaries

**Always (hacer siempre):**
- Correr `npm run lint && npm run typecheck && npm run test` antes de commit
- Usar `withTenant()` para queries de panel cliente (RLS)
- Validar entrada con Zod en API routes
- Loguear acciones sensibles en `audit_log`
- Variables de entorno sin prefijo hardcodeado (usar `process.env.VAR`)

**Ask First (preguntar antes):**
- Cambios en `prisma/schema.prisma` (migraciones)
- Nuevas dependencias npm (bundle size, seguridad)
- Cambios en `next.config.mjs`, `Dockerfile`, `docker-compose.yml`
- Modificar RLS policies
- Cambiar proveedores de IA (Ollama ↔ OpenRouter)

**Never (nunca):**
- Commitear secrets (`.env`, keys) — usar Dokploy Environment
- Editar `node_modules/` o `.next/`
- Desactivar tests que fallan sin fixear root cause
- Hardcodear URLs de producción en código
- Usar `BYPASSRLS` en rol de aplicación (solo admin)

---

## Success Criteria

**Fase 0 - Fundación (Actual):**
- [x] Scaffold Next.js + Prisma + NextAuth + Docker + RLS funcionando
- [x] Deploy en Dokploy respondiendo en `aicorelink.aicorebots.com`
- [x] Login demo funcionando (admin@example.com / admin123456)

**Fase 1 - Marketing Site Público:**
- [ ] Landing page completa en `aicorelink.aicorebots.com` con hero, planes, dolores, FAQ, CTA
- [ ] Página `/planes` con tabla comparativa interactiva
- [ ] Registro + Checkout Stripe funcional (suscripción + setup fee)
- [ ] Provisionado automático: tenant + subdominio + n8n workflow + credenciales Meta
- [ ] Email de bienvenida + credenciales portal

**Fase 2 - Portal Cliente:**
- [ ] Dashboard con métricas: leads, conversaciones, uso WhatsApp/IA, costo estimado
- [ ] Configuración WhatsApp: tono, horario, base conocimiento, escalado, voz
- [ ] CRM simple: lista leads, detalle conversación, exportar CSV
- [ ] Facturación: historial Stripe, facturas descargables, cambio plan
- [ ] Configuración equipo: invitar usuarios, roles

**Fase 3 - IA + WhatsApp + Voz:**
- [ ] Clasificador intención (Ollama local → fallback OpenRouter)
- [ ] Respuestas automáticas con base de conocimiento por tenant
- [ ] Escalado por palabras clave + notificación email/Telegram
- [ ] WhatsApp Voz: Whisper STT → IA → ElevenLabs TTS → nota de voz
- [ ] Reseñas automáticas: post-conversación → link Google Review

**Fase 4 - Site Builder (Opcional/MVP+):**
- [ ] Editor visual drag-and-drop para su sitio (secciones predefinidas)
- [ ] Publicación automática en subdominio
- [ ] SEO on-page automático (meta tags, JSON-LD, sitemap)

**Fase 5 - Growth & Ops:**
- [ ] Dashboard admin multi-tenant: MRR, churn, LTV, CAC, uso agregado
- [ ] Automatización onboarding: secuencia emails + checklist
- [ ] Programa referidos + afiliados
- [ ] A/B testing landing + pricing

---

## Open Questions

1. **Precio final planes:** ¿Definimos rangos o precios exactos ahora? (Starter $49/79, Growth $99/149, Elite $199/299)
2. **Setup fee:** ¿$0 para todos o escalonado ($0 Starter, $99 Growth, $199 Elite)?
3. **Dominio cliente:** ¿Subdominio `cliente.aicorelink.aicorebots.com` o dominio propio traído por cliente (CNAME)?
4. **WhatsApp:** ¿Un número compartido (Meta Cloud API) por tenant o número dedicado? (Costo distinto)
5. **Límites uso:** ¿Cuántos mensajes IA/WhatsApp incluidos por plan? Overages ¿cómo se cobran?
6. **Onboarding manual vs auto:** ¿El cliente configura su base de conocimiento solo o hacemos setup asistido?
7. **Idioma:** ¿Solo español (Latam) o multi-idioma desde inicio?
8. **Marca blanca:** ¿El portal/site muestra "Powered by AicoreLink" o marca blanca total?

---

## Ecosystem Integration (Coherencia con iapo.cl, aicorebots.com, med.aicorebots.com, captacion360.aicorebots.com)

**Diseño compartido:**
- Paleta: Navy (`#0F172A`) + Brand Blue (`#2563EB`) + Teal (`#0D9488`) + Slate scale
- Tipografía: Geist (Next.js default) — consistente en todo el ecosistema
- Layout: Sidebar fija 60-240px + main flex-1, `bg-slate-50` contenido, `bg-navy`/`bg-slate-900` sidebar
- Componentes UI: Mismos primitivos (Button, Card, Input, Modal, Badge, Table) en todos los productos
- Animaciones: Framer Motion sutil (fade-in, slide-up, stagger) — no distractivas

**Copy & Tone:**
- **Voz:** Profesional, cercana, experta pero accesible ("hablamos como tu socio técnico")
- **Estructura landing:** Hook → Dolores → Solución → Planes → Prueba social → FAQ → CTA
- **CTAs consistentes:** "Empezar gratis", "Ver demo", "Agendar llamada" — mismo estilo visual

**Cross-linking estrategia:**
- Footer AicoreLink → links a iapo.cl (recursos), aicorebots.com (agencia), med.aicorebots.com (caso clínicas)
- Blog/Recursos compartidos → contenido SEO reutilizable
- Casos de éxito: clínicas → med.aicorebots.com, gimnasios → captacion360.aicorebots.com

**Tecnología compartida:**
- Misma VPS, misma PostgreSQL, mismo n8n, mismo Ollama
- Skills `.opencode/skills/` reutilizables en todos los proyectos
- Deploy pattern idéntico: GitHub Actions → ghcr.io → Dokploy

---

## Copy & Persuasion Strategy (Landing aicorelink.aicorebots.com)

### Hero (Above Fold)
**Headline:** "Tu negocio contesta 24/7. Aunque tú duermas."
**Subhead:** "Sitios web con IA que capturan leads, agendan citas y atienden por WhatsApp y voz. Desde $49/mes todo incluido."
**CTA Primario:** "Ver planes y precios" → `/planes`
**CTA Secundario:** "Ver demo en vivo" → abre modal con chat demo
**Trust signal:** "Usado por 50+ negocios locales en Latam" (ajustar cuando real)

### Sección Dolores (Problem Agitation)
Tarjetas con icono + título + descripción corta:

1. **💬 "Pierdes clientes por no contestar a tiempo"**
   - "El 78% de clientes compra al primero que responde. WhatsApp sin respuesta = venta perdida."

2. **🌐 "Tu web no vende, solo existe"**
   - "Una web sin formulario, chat ni calendario es un folleto caro. Necesitas un embudo, no una tarjeta de presentación."

3. **📅 "Pierdes citas por gestión manual"**
   - "Llamadas perdidas, doble booking, recordatorios que no enviás. Tu agenda debería cuidarse sola."

4. **⭐ "No tenés reseñas y Google te ignora"**
   - "Negocios con 50+ reseñas consiguen 3x más clientes. Pedir reseñas a mano no escala."

5. **💸 "Desarrollo caro, mantenimiento eterno"**
   - "Pagar $3.000+ por una web y luego $200/mes por 'mantenimiento' que no incluye nada. El modelo está roto."

### Sección Solución (Product Reveal)
"Sitios web que trabajan por vos. No al revés."
- 3 columnas: **Atrae** (SEO + embudo) → **Convierte** (Formulario + Chat IA + Calendario) → **Retiene** (Reseñas + Voz IA + CRM)

### Planes (Pricing Table)
Tabla interactiva con toggle mensual/anual (descuento 20% anual).
Cada plan: nombre, precio, 5-6 features clave, CTA "Empezar ahora" → `/register?plan=X`
**Ancla visual:** Plan Growth destacado ("Más popular") con badge teal.

### Casos de Éxito / Demo
- Tabs por vertical: Clínicas, Gimnasios, Restaurantes, Inmobiliarias, Servicios
- Cada tab: screenshot del sitio + métricas (leads/mes, % conversión, ahorro horas)
- Botón "Ver demo interactiva" → abre el chat demo real con esa vertical

### FAQ (Objection Handling)
1. **¿Qué incluye el precio mensual?** Hosting + SSL + WhatsApp Business API + IA (local + cloud) + mantenimiento + soporte + actualizaciones.
2. **¿Tengo que saber programar?** No. Nosotros lo configuramos todo. Vos solo aprobás el contenido.
3. **¿Puedo usar mi dominio?** Sí. Plan Growth/Elite: traé tu dominio, nosotros configuramos DNS.
4. **¿Qué pasa si me quiero ir?** Exportás tus leads y conversaciones. Tu sitio se puede migrar (HTML estático).
5. **¿La IA alucina?** Usamos RAG con tu base de conocimiento + escalado humano automático. No inventa.

### CTA Final
"¿Listo para dejar de perder clientes?"
[Botón] "Elegir mi plan" → `/planes`
[Link] "Agendar llamada de 15 min" → Calendly/Cal.com

---

## Captación & Conversión Strategy

### Tráfico (Top of Funnel)
1. **SEO Local Programático:** Landing por vertical + ciudad (`/clinicas-cordoba`, `/gimnasios-rosario`) — contenido IA + plantilla
2. **Google Ads / Meta Ads:** Targeting dueños de negocio local por intereses + comportamiento
3. **Content Marketing:** Blog "Cómo automatizar tu clínica/gimnasio/restaurante" → lead magnet (checklist PDF)
4. **Outbound Inteligente:** Scraping Google Maps → detectar negocios sin web / web mala → email personalizado + Loom video
5. **Referidos:** 1 mes gratis por cliente referido que pague 3 meses
6. **Alianzas:** Contadores, asesores, cámaras de comercio → commission 20% primer año

### Conversión (Middle/Bottom)
- **Lead Magnet:** "Calculá cuántos clientes perdés por mes" → formulario 3 campos → resultado + email sequence
- **Demo Interactiva:** Chat real en landing con IA configurada para su vertical
- **Video Loom Personalizado:** Para leads calificados (score > 70), video 2 min mostrando su web actual vs propuesta
- **Garantía:** "Si en 30 días no recuperás la inversión, te devolvemos el dinero" (reduce riesgo percibido)
- **Urgencia Ética:** "Solo onboarding 5 nuevos clientes/semana para asegurar calidad" (real, por capacidad de setup)

### Retención & Expansión
- **Onboarding 14 días:** Día 1: Bienvenida + credenciales. Día 3: Setup WhatsApp. Día 7: Primer lead. Día 14: Revisión métricas.
- **Health Score:** Dashboard interno alerta si cliente sin leads 14 días / uso IA < 20% / no configuró base conocimiento
- **Upsell Natural:** Starter → Growth cuando supera 50 leads/mes. Growth → Elite cuando pide voz o multi-ubicación.
- **NPS Trimestral:** Encuesta 1 click en portal → seguimiento personal si < 8

---

## Diseño Moderno & Novedoso (Visual Direction)

### Principios
1. **Claridad ante todo** — Negocios locales no son techies; cada elemento debe ser autoexplicativo
2. **Confianza visual** — Clean, spacious, tipografía legible, contrastes AA
3. **Diferenciación sutil** — No "otro SaaS genérico"; acentos teal/brand que recuerdan a Aicore pero más cálido
4. **Mobile-first real** — 70%+ tráfico mobile; hero, tablas, formularios perfectos en 375px

### Componentes Clave (Nuevos o Extendidos)

**Marketing:**
- `HeroSection` — Video background sutil (webm loop muted) o ilustración SVG animada (Lottie)
- `PricingTable` — Toggle mensual/anual, hover states, plan destacado con glow teal
- `PainCard` — Icono animado (hover), copy persuasivo, micro-interacciones
- `VerticalTabs` — Demo por rubro, switch sin recarga
- `InteractiveDemo` — Iframe o modal con chat real funcionando
- `TrustBar` — Logos clientes + "Como visto en" + métricas agregadas

**Portal:**
- `MetricCard` — Valor grande + trend (↑↓%) + sparkline mini
- `LeadTable` — Sortable, filtrable, row-expand para ver conversación
- `ChatConfigurator` — Sidebar tabs (General/IA/Escalado/Voz), preview en vivo a la derecha
- `SitePreview` — Iframe del sitio del cliente dentro del portal (fase 2)
- `UsageMeter` — Barra circular progreso (mensajes IA usados / límite plan)

### Animaciones (Framer Motion)
- **Entrada:** `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}`
- **Stagger:** Container `transition={{ staggerChildren: 0.1 }}`
- **Hover cards:** `whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}`
- **Botones:** `whileTap={{ scale: 0.98 }}`
- **Modales:** `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}`

### Accesibilidad
- Semántica HTML5 correcta (`<main>`, `<section>`, `<article>`, `<nav>`)
- Focus visible: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`
- Contraste AA mínimo (textos 4.5:1, UI 3:1)
- ARIA labels en iconos-only, modales, tabs
- `prefers-reduced-motion` respeta animaciones

---

## Próximos Pasos (Post-Spec)

1. **Aprobar esta spec** → Crear plan detallado (`writing-plans` skill)
2. **Plan** → Desglose en tareas atómicas con criterios de aceptación
3. **Tasks** → Implementación incremental con TDD
4. **Deploy** → Validación en staging → producción

---

**Estado:** Borrador para revisión. Pendiente aprobación humano antes de pasar a Fase 2 (Plan).