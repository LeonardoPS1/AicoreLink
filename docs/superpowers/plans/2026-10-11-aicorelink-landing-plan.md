# Plan: AicoreLink Landing Page — Sitios Web con IA para Negocios de Servicios

**Fecha:** 2026-10-11
**Spec padre:** `docs/superpowers/specs/2026-10-11-aicorelink-saas-redesign-design.md`
**Alcance:** SOLO la landing/marketing site pública en `aicorelink.aicorebots.com`. NO incluye portal cliente, checkout Stripe, ni provisión automática (esos van en el plan SaaS completo).
**Objetivo:** Landing de una sola página orientada 100% a conversión, que venda el servicio de sitios web con IA a negocios locales de SERVICIOS que necesitan captar, convertir y atender clientes.

---

## 0. Decisiones de Alcance (lo que SÍ y NO entra)

**SÍ entra:**
- Landing pública single-page en `aicorelink.aicorebots.com`
- Secciones: Hero, Dolores, Solución, Cómo funciona, Verticales, Planes (informativo), Prueba social, FAQ, CTA final
- Formulario de contacto/lead (nombre, negocio, WhatsApp, vertical) → guarda lead + notifica
- Botones CTA que llevan a WhatsApp directo (`wa.me`) y/o agendamiento
- SEO on-page + Open Graph + performance
- Responsive mobile-first
- Analytics de conversión

**NO entra (queda para el plan SaaS):**
- Registro de usuarios, login, portal cliente
- Checkout Stripe y suscripciones
- Provisión automática de tenants/subdominios
- Configuración WhatsApp/IA en vivo
- Site builder

**Por qué:** El objetivo de esta fase es **captar leads y validar demanda** antes de construir la maquinaria SaaS. El CTA de esta landing no vende una suscripción self-service; vende un **contacto** (WhatsApp/agenda), porque el producto se cierra con una llamada de diagnóstico.

---

## 1. Público Objetivo

**SÍ (negocios de servicios que viven de captar y atender):**
- Barberías y peluquerías
- Talleres mecánicos / service de autos
- Estudios jurídicos / abogados
- Inmobiliarias
- Clínicas pequeñas / consultorios (odontología, kinesio, estética)
- Servicios a domicilio (plomeros, electricistas, gasistas)
- Dietistas, psicólogos, contadores
- Gimnasios / entrenadores personales
- Veterinarias
- Cerrajerías, mudanzas, limpieza

**NO (tiendas con catálogo / e-commerce):**
- Tiendas de ropa, zapaterías, kioscos, supermercados
- Tiendas online con carrito de compras
- Cualquier negocio cuyo modelo sea vender SKUs con stock

**Rasgo común del público SÍ:** el negocio vende **tiempo, servicios y confianza**. No tiene un "catálogo"; tiene **una agenda, una consulta, un presupuesto**. Su dinero se pierde cuando **no responde a tiempo** o cuando **no genera confianza online**.

**Decisión de copy (importante):** El texto de la landing va en **español neutro profesional de Latam** (no voseo rioplatense en la landing pública; sí se puede hablar de "vos" solo si el negocio objetivo es Argentina). Default: español neutro, cálido y directo.

---

## 2. Dolores específicos por vertical (base para el copy)

| Vertical | Dolor principal | Frase-ancla para la landing |
|----------|-----------------|-----------------------------|
| **Barbería** | Turnos por DM/WhatsApp perdidos, no-shows | "Cada mensaje sin responder es un turno que se va a otra barbería." |
| **Taller mecánico** | Llamadas perdidas cuando están bajo el auto | "Estás debajo del auto, no podés atender. El cliente llama a otro taller." |
| **Abogado** | Consultas fuera de horario sin filtrar; pierde tiempo en casos que no califican | "Consultas que no filtran tu tiempo valen menos que cero." |
| **Inmobiliaria** | Leads que se enfrían en horas; competencia responde más rápido | "El que responde primero, cierra. El lead de las 22:00 se va en 5 minutos." |
| **Clínica pequeña** | Recepcionista saturada; teléfono ocupado; citas duplicadas | "Recepción ocupada = paciente que no vuelve a llamar." |
| **Servicios a domicilio (plomero/electricista)** | Está trabajando, no puede contestar | "Mientras trabajás, tu teléfono es tu mejor vendedor y está apagado." |
| **Gimnasio / entrenador** | Pierde prospectos que preguntan precios y no convierten | "Te preguntan el precio y nunca más escriben. Eso es un embudo roto." |

**Dolores transversales (aplican a todos):**
1. **Respuesta lenta = venta perdida.** El 78% compra al primero que responde. Fuera de horario, el negocio "cierra" aunque el cliente tenga la billetera abierta.
2. **Web que no vende, solo existe.** Folleto estático sin formulario, sin chat, sin agenda.
3. **Citas y presupuestos por WhatsApp manual.** Doble booking, recordatorios que no salen.
4. **Sin reseñas, Google te ignora.** 50+ reseñas = 3x más contactos. Pedirlas a mano no escala.
5. **Costo y mantenimiento eternos.** Pagan una web carísima que nadie actualiza.

---

## 3. Arquitectura Técnica

| Área | Decisión |
|------|----------|
| **App** | Next.js 14 App Router (extiende el scaffold actual `apps/dashboard`) |
| **Ruta** | `app/(marketing)/page.tsx` como landing; dominio `aicorelink.aicorebots.com` |
| **Estilos** | Tailwind CSS + sistema de diseño compartido (tokens del ecosistema Aicore) |
| **Animaciones** | Framer Motion (entradas sutiles, stagger, hover) + `prefers-reduced-motion` |
| **Formulario** | React Hook Form + Zod; Server Action `POST /api/leads` |
| **Persistencia lead** | Tabla `landing_leads` en Postgres (sin tenant; son leads de AicoreLink) |
| **Notificación** | Webhook a n8n → email + Telegram/Slack al equipo |
| **CTA WhatsApp** | `https://wa.me/<numero>?text=<prefill>` — sin backend |
| **Analytics** | Vercel Analytics o Plausible + eventos de conversión (`cta_click`, `form_submit`, `vertical_view`) |
| **SEO** | Metadata API, Open Graph, JSON-LD (Organization + Service + FAQPage) |
| **Deploy** | Dokploy service existente (`aicorelink-aicorelink-b7m7ol`) |

**Estructura de archivos nueva:**
```
apps/dashboard/app/(marketing)/
├── layout.tsx                     # Header minimal + Footer ecosistema
├── page.tsx                       # Ensambla todas las secciones
├── opengraph-image.tsx            # OG dinámico
├── sitemap.ts
├── robots.ts
└── componentes/                   # (o components/marketing/)
    ├── HeroSection.tsx
    ├── PainSection.tsx
    ├── PainCard.tsx
    ├── SolutionSection.tsx
    ├── HowItWorks.tsx
    ├── VerticalsSection.tsx
    ├── PricingSection.tsx
    ├── PricingCard.tsx
    ├── TestimonialsSection.tsx
    ├── FAQSection.tsx
    ├── CTASection.tsx
    ├── TrustBar.tsx
    ├── LeadForm.tsx
    ├── StickyWhatsApp.tsx
    ├── SiteHeader.tsx
    └── SiteFooter.tsx
apps/dashboard/app/api/leads/route.ts
apps/dashboard/lib/leads/schema.ts        # Zod schema lead
apps/dashboard/lib/leads/notify.ts        # notificar a n8n
apps/dashboard/lib/marketing/copy.ts      # copy centralizado (i18n-ready)
apps/dashboard/lib/marketing/verticals.ts # data de verticales
```

---

## 4. Estructura de la Página (orden de secciones)

1. **Header** (sticky, transparente → sólido al scroll): logo AicoreLink + nav (Cómo funciona, Verticales, Planes, FAQ) + CTA "Hablar con nosotros"
2. **Hero** — promesa + prueba + CTA doble + WhatsApp flotante
3. **TrustBar** — métricas agregadas / "ideal para" mini-logos de rubros
4. **PainSection** — los 5 dolores (problem agitation)
5. **SolutionSection** — la solución en 3 columnas: Atrae → Convierte → Atiende
6. **HowItWorks** — 3-4 pasos ("Nos contás → Te armamos el sitio → Conectamos WhatsApp/IA → Empezás a recibir clientes")
7. **VerticalsSection** — tabs/carrusel por rubro con dolor + beneficio + mini-demo
8. **PricingSection** — 3 planes informativos (Starter/Growth/Elite) + CTA "Agendar diagnóstico"
9. **TestimonialsSection** — prueba social (placeholder hasta tener reales)
10. **FAQSection** — objeciones
11. **CTASection** — cierre + garantía + urgencia ética
12. **Footer** — links ecosistema, contacto, legal
13. **StickyWhatsApp** — botón flotante persistente

---

## 5. Sistema de Diseño (coherencia con ecosistema)

**Paleta (tokens Tailwind):**
| Token | Hex | Uso |
|-------|-----|-----|
| `navy` | `#0F172A` | Fondos oscuros, texto fuerte, header sólido |
| `navy-800` | `#1E293B` | Superficies oscuras secundarias |
| `brand` | `#2563EB` | CTA primario, acentos, links |
| `brand-dark` | `#1D4ED8` | Hover CTA |
| `teal` | `#0D9488` | Acento secundario, plan destacado, "IA" |
| `teal-light` | `#5EEAD4` | Glow, badges, acentos sobre navy |
| `slate-50` | `#F8FAFC` | Fondo secciones claras |
| `slate-200` | `#E2E8F0` | Bordes |
| `slate-600` | `#475569` | Texto secundario |
| `amber` | `#F59E0B` | Alertas de dolor, urgencia |

**Tipografía:** Geist Sans (default Next.js) — consistente con el ecosistema. Escala: `text-5xl/6xl` hero, `text-3xl/4xl` títulos sección, `text-lg` body, `text-sm` captions.

**Espaciado:** secciones `py-20 md:py-28`, contenedor `max-w-6xl mx-auto px-4`. Mobile-first real (perfecto en 375px).

**Estilo visual:** claro, espacioso, confiable. Gradiente sutil `from-navy to-navy-800` en secciones oscuras; alternar claro/oscuro entre secciones para ritmo. Acento teal para lo "IA". Micro-ilustraciones SVG o iconos lucide (no stock photos genéricas; usar mockups de UI real del producto).

**Animaciones (Framer Motion):**
- Entrada: `opacity 0→1, y 20→0`, `duration 0.4`, ease-out
- Stagger en grids: `staggerChildren 0.08`
- Hover cards: `y: -4`, sombra suave
- Botones: `whileTap scale 0.98`
- Respetar `prefers-reduced-motion`

**Accesibilidad:** semántica HTML5, `focus-visible:ring-2 ring-brand`, contraste AA, ARIA en accordion/tabs/modales, alt en imágenes.

---

## 6. Copy Completo (español neutro, listo para pegar)

> El copy vive en `lib/marketing/copy.ts` como constantes, no hardcodeado en JSX.

### 6.1 Header
- Logo: **AicoreLink**
- Nav: Cómo funciona · Rubros · Planes · Preguntas
- CTA header: **"Hablar con nosotros"**

### 6.2 Hero
- **Eyebrow:** "Sitios web con IA para negocios que viven de sus clientes"
- **Headline:** **"Tu negocio atiende y capta clientes 24/7. Aunque tú estés trabajando."**
- **Subhead:** "Creamos tu página web y le conectamos un asistente con IA que responde por WhatsApp, agenda citas y nunca deja un mensaje sin contestar. Todo incluido en una cuota mensual."
- **CTA primario:** "Quiero mi sitio con IA" → formulario/WhatsApp
- **CTA secundario:** "Ver cómo funciona" → scroll a HowItWorks
- **Trust line:** "Ideal para barberías, talleres, estudios, inmobiliarias, clínicas y todo negocio de servicios."

### 6.3 TrustBar
"Más de **9 de cada 10** clientes elige al negocio que responde primero. Que sea el tuyo."
Mini-items: ⚡ Responde en segundos · 🗓️ Agenda sola · ⭐ Consigue reseñas · 📱 Hecho para WhatsApp

### 6.4 PainSection
- **Título:** "Si te identificás con esto, estás perdiendo clientes todos los días"
- **Card 1 — 💬 "No llegás a contestar"**
  "Estás con un cliente, manejando o ya cerraste. El mensaje llega igual. Y el cliente no espera: le escribe al siguiente de la lista."
- **Card 2 — 🌐 "Tu web existe, pero no vende"**
  "Una página que solo muestra información es un folleto caro. Sin formulario, sin chat y sin agenda, el visitante se va sin dejar rastro."
- **Card 3 — 📅 "Agendás a mano"**
  "Turnos por WhatsApp, llamadas perdidas y citas que se superponen. Tu agenda te consume más tiempo del que te ahorra."
- **Card 4 — ⭐ "No tenés reseñas y Google te ignora"**
  "Los negocios con más reseñas consiguen hasta 3 veces más contactos. Pedirlas una por una, nunca alcanza."
- **Card 5 — 💸 "Pagar una web es caro y mantenerla, peor"**
  "Precios altísimos por un sitio que después nadie actualiza. Y cada cambio se cobra aparte."
- **Cierre de sección:** "Todos estos problemas tienen la misma causa: falta de atención automática. Y la misma solución."

### 6.5 SolutionSection
- **Título:** "Un sitio web que trabaja para tu negocio. No al revés."
- **Columna 1 — Atrae 📈** "Diseño pensado para convertir y aparecer en Google, con la información que tus clientes buscan: servicios, precios, ubicación y confianza."
- **Columna 2 — Convierte 🎯** "Formulario, botón de WhatsApp y asistente con IA que responde al instante, resuelve dudas y toma los datos del cliente."
- **Columna 3 — Atiende 🤖** "La IA agenda citas, envía recordatorios, pide reseñas automáticamente y te avisa cuando hace falta que intervengas vos."

### 6.6 HowItWorks
- **Título:** "Empezás a recibir clientes en pocos días"
- **Paso 1 — Nos contás tu negocio.** "Una llamada de 15 minutos. Nos contás qué hacés, a quién atendés y qué querés lograr."
- **Paso 2 — Te armamos el sitio.** "Diseñamos tu página web con IA, lista para convertir. Vos aprobás el contenido."
- **Paso 3 — Conectamos WhatsApp e IA.** "Enlazamos tu WhatsApp y entrenamos al asistente con tu información."
- **Paso 4 — Recibís clientes.** "Tu web capta, tu IA atiende y vos te enfocás en trabajar. Nosotros nos ocupamos del resto."

### 6.7 VerticalsSection
- **Título:** "Hecho para negocios como el tuyo"
- **Subtítulo:** "Si vendés servicios, tiempo o consultas (no un catálogo de productos), esto es para vos."
- Tabs: Barberías · Talleres · Abogados · Inmobiliarias · Clínicas · A domicilio
- Cada tab: dolor (de la tabla §2) + cómo lo resuelve + métrica ilustrativa + CTA contextual "Quiero esto para mi [rubro]"
- **Nota explícita en la sección:** "No es para tiendas con catálogo. Es para negocios que necesitan captar, convertir y atender."

### 6.8 PricingSection
- **Título:** "Planes claros. Sin costos escondidos."
- **Subtítulo:** "Todo incluido: diseño, hosting, WhatsApp Business, IA y soporte."
- Planes (informativos):
  | Plan | Precio/mes | Para quién | Incluye |
  |------|-----------|------------|---------|
  | **Starter** | desde $49 | Negocio que arranca | 3 páginas · formulario · chat básico · hosting |
  | **Growth** ⭐ Más elegido | desde $99 | Negocio que quiere crecer | 5 páginas · calendario · reseñas automáticas · chat IA |
  | **Elite** | desde $199 | Negocio que quiere automatizar todo | 10 páginas · chat IA avanzado · recepcionista de voz |
- **CTA por plan:** "Agendar diagnóstico gratis"
- **Nota:** "La inversión inicial puede ser $0. Vos elegís: pagás solo la cuota mensual o un setup mínimo para arrancar antes."

### 6.9 TestimonialsSection
- **Título:** "Negocios que ya no pierden clientes" (usar placeholders marcados claramente hasta tener reales; no inventar métricas falsas atribuidas a personas reales).

### 6.10 FAQSection (objeciones)
1. **¿Qué incluye la cuota mensual?** "Diseño, hosting, SSL, WhatsApp Business, asistente con IA, mantenimiento, actualizaciones y soporte. Una sola cuota."
2. **¿Necesito saber de tecnología?** "No. Nosotros armamos y configuramos todo. Vos solo aprobás el contenido."
3. **¿Puedo usar mi propio dominio?** "Sí. Si ya tenés dominio, lo conectamos. Si no, te ayudamos a conseguirlo."
4. **¿La IA responde cualquier cosa?** "No. La entrenamos con tu información real y, cuando no sabe, te pasa la conversación a vos. No inventa."
5. **¿Y si ya tengo una web?** "La renovamos o te armamos una nueva que sí convierta. Sin perder lo que ya posicionaste."
6. **¿Hay contrato mínimo?** "Trabajamos mes a mes. Si en 30 días no ves resultados, no seguimos."
7. **¿Sirve para mi rubro?** "Si tu negocio necesita captar, convertir o atender clientes, sí. Si vendés un catálogo de productos, no es para vos."

### 6.11 CTASection
- **Título:** "¿Listo para dejar de perder clientes?"
- **Subtítulo:** "Agendá una llamada de 15 minutos. Te mostramos cómo se vería tu negocio con un sitio que atiende solo."
- **Botón primario:** "Agendar diagnóstico gratis" → Calendly/Cal.com
- **Botón secundario:** "Escribir por WhatsApp" → wa.me
- **Garantía:** "Sin compromiso. Si no es para vos, te lo decimos."

### 6.12 StickyWhatsApp
- Botón flotante esquina inferior derecha: "¿Hablamos? 💬" → wa.me con mensaje precargado "Hola, quiero un sitio web con IA para mi negocio."

---

## 7. Estrategias de Captación y Persuasión

### 7.1 Persuasión en la landing (on-page)
1. **Promesa específica, no genérica.** "Atiende 24/7 aunque estés trabajando" > "presencia online".
2. **Problem agitation antes de solución.** El visitante debe verse reflejado en los dolores ANTES de ver el precio.
3. **Prueba social desde el minuto uno.** Métrica agregada en hero + testimonios (reales cuando existan).
4. **Reducción de riesgo.** Garantía 30 días + "diagnóstico gratis" + "sin contrato".
5. **Urgencia ética.** "Tomamos hasta 5 negocios nuevos por semana para asegurar la calidad" (solo si es real).
6. **CTA repetido y contextual.** Cada sección termina con una acción; el CTA cambia según el rubro del visitante.
7. **Un solo objetivo de conversión.** Todo empuja a "agendar/WhatsApp", no a features.

### 7.2 Captación (tráfico)
1. **WhatsApp directo** como CTA principal (es donde vive este público).
2. **SEO local + por rubro:** páginas `/[rubro]` (ej. `/barberias`, `/talleres`) generadas con plantilla → rankear "página web para barbería".
3. **Google/Meta Ads:** segmentación por rubro y zona; creativos con el dolor + resultado.
4. **Outbound con Google Maps:** detectar negocios sin web o con web pobre → mensaje personalizado + propuesta.
5. **Referidos:** 1 mes gratis por cliente que traiga 3 meses.
6. **Alianzas:** cámaras de comercio, cámaras por rubro, gestores → comisión.

### 7.3 Conversión (lead → cliente)
1. **Lead magnet en el sitio:** "Calculá cuántos clientes perdés por mes" (mini calculadora) → captura contacto.
2. **Diagnóstico de 15 min** como oferta puente (corta fricción de compra).
3. **Respuesta inmediata al lead** (n8n + IA): el propio producto demuestra lo que vende.
4. **Seguimiento:** 3 toques (WhatsApp, email con caso similar, recordatorio) antes de dar por perdido.

---

## 8. SEO y Performance

- **Metadata:** title "Sitios web con IA para negocios de servicios | AicoreLink", description con promesa + rubros, canonical.
- **Open Graph / Twitter Card** con `opengraph-image.tsx` dinámico.
- **JSON-LD:** `Organization`, `Service`, `FAQPage`, `BreadcrumbList`.
- **Performance:** Server Components por defecto, imágenes optimizadas (`next/image`), fuentes con `next/font`, JS de animación cargado lazy, Core Web Vitals verdes (LCP < 2.5s, CLS < 0.1).
- **sitemap.ts / robots.ts** estáticos.
- **Futuro:** páginas por rubro para SEO programático (§7.2).

---

## 9. Tasks Atómicas (orden de ejecución)

> Formato cada task: **archivos · criterio de aceptación · test · tipo de commit**

### Bloque A — Fundación (base para todo)
1. **A1 — Tokens de diseño + Tailwind**
   - Archivos: `tailwind.config.ts`, `app/globals.css`
   - Aceptación: tokens navy/brand/teal/slate definidos; fuente Geist configurada; `focus-visible` global.
   - Test: build + inspección visual de página de prueba.
   - Commit: `feat(design): add shared design tokens and typography`
2. **A2 — Copy centralizado + data de verticales**
   - Archivos: `lib/marketing/copy.ts`, `lib/marketing/verticals.ts`
   - Aceptación: todo el copy de §6 y la data de §2 como constantes tipadas; sin copy hardcodeado en JSX.
   - Test: unit (tipos + claves presentes).
   - Commit: `feat(marketing): centralize landing copy and vertical data`
3. **A3 — Primitivos UI**
   - Archivos: `components/ui/` (Button, Card, Badge, Accordion, Tabs, SectionHeading)
   - Aceptación: variantes primary/secondary/ghost, tamaños, estados focus/hover/disabled; animaciones base.
   - Test: unit render de cada primitivo.
   - Commit: `feat(ui): add marketing UI primitives`

### Bloque B — Estructura de página
4. **B1 — Header + Footer + layout marketing**
   - Archivos: `app/(marketing)/layout.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`
   - Aceptación: header sticky (transparente→sólido al scroll), nav ancla a secciones, CTA; footer con links ecosistema.
   - Test: E2E carga + navegación ancla.
   - Commit: `feat(marketing): add site header and footer`
5. **B2 — Hero + TrustBar**
   - Archivos: `HeroSection.tsx`, `TrustBar.tsx`
   - Aceptación: headline/subhead/CTA doble/trust line según §6.2-6.3; responsive 375px.
   - Test: unit render + E2E CTA.
   - Commit: `feat(marketing): add hero and trust bar`
6. **B3 — PainSection + PainCard**
   - Archivos: `PainSection.tsx`, `PainCard.tsx`
   - Aceptación: 5 dolores de §6.4, icono + título + descripción, hover micro-interacción, cierre de sección.
   - Test: unit render (5 cards) + a11y focus.
   - Commit: `feat(marketing): add pain points section`
7. **B4 — SolutionSection**
   - Archivos: `SolutionSection.tsx`
   - Aceptación: 3 columnas Atrae/Convierte/Atiende según §6.5.
   - Test: unit render.
   - Commit: `feat(marketing): add solution section`
8. **B5 — HowItWorks**
   - Archivos: `HowItWorks.tsx`
   - Aceptación: 4 pasos numerados de §6.6 con línea/indicador de progreso.
   - Test: unit render.
   - Commit: `feat(marketing): add how-it-works steps`
9. **B6 — VerticalsSection**
   - Archivos: `VerticalsSection.tsx`
   - Aceptación: tabs por rubro (§6.7), contenido desde `verticals.ts`, CTA contextual, nota "no es para catálogo", accesible (tabs ARIA).
   - Test: unit (switch tab data) + E2E (sin reload).
   - Commit: `feat(marketing): add verticals section`
10. **B7 — PricingSection + PricingCard**
    - Archivos: `PricingSection.tsx`, `PricingCard.tsx`
    - Aceptación: 3 planes de §6.8, Growth destacado (badge + glow teal), features, CTA por plan.
    - Test: unit render + E2E CTA.
    - Commit: `feat(marketing): add pricing section`
11. **B8 — TestimonialsSection**
    - Archivos: `TestimonialsSection.tsx`
    - Aceptación: estructura lista; placeholders claramente marcados (no métricas falsas atribuidas a personas reales).
    - Test: unit render.
    - Commit: `feat(marketing): add testimonials section`
12. **B9 — FAQSection**
    - Archivos: `FAQSection.tsx`
    - Aceptación: accordion accesible con las 7 preguntas de §6.10.
    - Test: unit (abre/cierra) + a11y.
    - Commit: `feat(marketing): add FAQ section`
13. **B10 — CTASection + StickyWhatsApp**
    - Archivos: `CTASection.tsx`, `StickyWhatsApp.tsx`
    - Aceptación: cierre §6.11-6.12 con botón agenda + WhatsApp; flotante persistente.
    - Test: unit + E2E (WhatsApp URL correcta).
    - Commit: `feat(marketing): add final CTA and sticky WhatsApp`
14. **B11 — Ensamble `page.tsx`**
    - Archivos: `app/(marketing)/page.tsx`
    - Aceptación: orden §4 completo, lazy donde aplique, sin errores de hidratación.
    - Test: E2E scroll completo + todas las secciones presentes.
    - Commit: `feat(marketing): assemble landing page`

### Bloque C — Conversión y backend de leads
15. **C1 — LeadForm + Zod schema**
    - Archivos: `LeadForm.tsx`, `lib/leads/schema.ts`
    - Aceptación: campos (nombre, negocio, WhatsApp, rubro, mensaje), validación Zod, estados loading/success/error, accesible.
    - Test: unit validation (casos válidos/ inválidos).
    - Commit: `feat(leads): add lead form with validation`
16. **C2 — API `/api/leads` + persistencia**
    - Archivos: `app/api/leads/route.ts`, migración `landing_leads`, `lib/db.ts` (reuso)
    - Aceptación: `POST` valida Zod, guarda lead, devuelve 201; rate-limit básico; no expone datos.
    - Test: integration (POST válido → fila creada; inválido → 400).
    - Commit: `feat(leads): add lead capture endpoint`
17. **C3 — Notificación de lead (n8n)**
    - Archivos: `lib/leads/notify.ts`
    - Aceptación: al crear lead, dispara webhook n8n (email + Telegram/Slack); falla silenciosa sin romper la respuesta al usuario.
    - Test: integration (mock webhook llamado).
    - Commit: `feat(leads): notify team on new lead`

### Bloque D — SEO, analytics, polish
18. **D1 — Metadata + OG + JSON-LD**
    - Archivos: `app/(marketing)/page.tsx` (metadata), `opengraph-image.tsx`, `lib/marketing/structured-data.ts`
    - Aceptación: title/description/OG/Twitter + JSON-LD Organization/Service/FAQPage validados.
    - Test: unit (JSON-LD shape) + validación Rich Results.
    - Commit: `feat(seo): add metadata structured data and og image`
19. **D2 — sitemap + robots**
    - Archivos: `app/sitemap.ts`, `app/robots.ts`
    - Aceptación: genera entradas correctas con dominio de producción.
    - Test: unit.
    - Commit: `feat(seo): add sitemap and robots`
20. **D3 — Analytics de conversión**
    - Archivos: `lib/analytics.ts`, wiring en CTAs y form
    - Aceptación: eventos `cta_click` (con label), `form_submit`, `whatsapp_click`, `vertical_view`.
    - Test: unit (wrapper llama provider) + verificación en vivo.
    - Commit: `feat(analytics): track landing conversion events`
21. **D4 — Performance + a11y audit**
    - Aceptación: Lighthouse ≥ 95 en Performance/A11y/SEO/Best Practices; LCP < 2.5s; sin warnings de contraste; `prefers-reduced-motion` respetado.
    - Test: Lighthouse CI + axe.
    - Commit: `chore(marketing): performance and accessibility polish`
22. **D5 — Responsive QA (375 / 768 / 1440)**
    - Aceptación: sin overflow horizontal, tablas/pricing legibles, tabs funcionan, sticky WhatsApp no tapa contenido.
    - Test: E2E Playwright 3 viewports.
    - Commit: `test(marketing): add responsive e2e coverage`

---

## 10. Dependencias / Critical Path

```
A1 (tokens) ─┬─ A3 (UI) ─┬─ B1..B11 (secciones) ── B11 (ensamble)
A2 (copy) ───┘           │
                         └─ C1 (form) ─ C2 (api) ─ C3 (notify)
B11 ──────────────────────── D1..D5 (SEO/analytics/polish)
```

- Bloque A es bloqueante.
- Bloque B puede paralelizarse internamente una vez hecho A3.
- C1 depende de A3 (usar Button/Input) y A2 (copy).
- D bloque se hace sobre B11 + C completo.

---

## 11. Definition of Done (Landing)

- [ ] `aicorelink.aicorebots.com` responde 200, HTTPS, todas las secciones renderizan
- [ ] CTA "Agendar diagnóstico" y "WhatsApp" funcionan en desktop y mobile
- [ ] Formulario valida, guarda el lead en `landing_leads` y notifica al equipo
- [ ] Lighthouse ≥ 95 (Perf/A11y/SEO/BP) en mobile y desktop
- [ ] Responsive impecable en 375 / 768 / 1440
- [ ] Copy en español neutro, revisado por Leonardo
- [ ] Sin referencias a "catálogo/tienda"; posicionamiento 100% servicios
- [ ] Metadata + OG + JSON-LD válidos
- [ ] Eventos de conversión registrándose
- [ ] `npm run lint && npm run typecheck && npm run test` verdes

---

## 12. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Copy final sin validar con Leonardo | Centralizar en `copy.ts`; iterar rápido sin tocar JSX |
| Placeholders de testimonios confundidos con reales | Marcar explícitamente en código y en UI de revisión |
| Overpromise de la IA (alucinaciones) | Copy honesto: "cuando no sabe, te pasa la conversación" |
| Fricción del CTA (agenda vs WhatsApp) | Dos CTA claros; WhatsApp como vía principal de este público |
| SEO programático por rubro prematuro | Dejar `verticals.ts` listo para generar páginas luego |
