/**
 * Server-side HTML renderer for the Fábrica de sitios (site factory).
 *
 * Converts the JSON block tree stored on SitePage.content into static HTML so
 * published sites can be exported as plain files and served by Traefik. This
 * module runs on the server only (no React, no client hooks).
 */

const DAYS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

/**
 * Escapes a value for safe interpolation into HTML text or attribute context.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

function heading(sectionTitle: unknown): string {
  return `<header class="text-center mb-12"><h2 class="text-3xl md:text-4xl font-bold text-navy">${escapeHtml(
    sectionTitle
  )}</h2></header>`;
}

function emptyState(message: string): string {
  return `<p class="text-center text-slate-500">${escapeHtml(message)}</p>`;
}

function renderHero(c: Record<string, any>): string {
  const { headline = "", subheadline = "", ctaPrimary = "", ctaSecondary = "", backgroundImage = "" } = c;
  const buttons = [
    ctaPrimary
      ? `<a href="#contacto" class="inline-block bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg">${escapeHtml(
          ctaPrimary
        )}</a>`
      : "",
    ctaSecondary
      ? `<a href="#contacto" class="inline-block border border-teal text-teal-light font-semibold px-6 py-3 rounded-lg">${escapeHtml(
          ctaSecondary
        )}</a>`
      : "",
  ]
    .filter(Boolean)
    .join("\n        ");

  return `<section class="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-navy via-slate-900 to-slate-800 text-white">
  ${
    backgroundImage
      ? `<img src="${escapeHtml(backgroundImage)}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-20" />`
      : ""
  }
  <div class="relative max-w-4xl mx-auto px-4 py-20 text-center">
    <h1 class="text-4xl md:text-6xl font-bold mb-6">${escapeHtml(headline)}</h1>
    ${subheadline ? `<p class="text-lg md:text-xl text-slate-200 mb-8">${escapeHtml(subheadline)}</p>` : ""}
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
        ${buttons}
    </div>
  </div>
</section>`;
}

function renderServices(c: Record<string, any>): string {
  const { sectionTitle = "Nuestros servicios", items = [] } = c;
  const cards = asArray(items)
    .map((item) => {
      const it = asObject(item);
      const price =
        typeof it.priceCLP === "number"
          ? `<p class="text-brand font-bold mt-2">$${it.priceCLP.toLocaleString("es-CL")} <span class="text-sm font-normal text-slate-500">CLP + IVA</span></p>`
          : "";
      const duration =
        typeof it.durationMin === "number"
          ? `<p class="text-sm text-slate-500 mt-1">⏱ ${escapeHtml(it.durationMin)} min</p>`
          : "";
      return `<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-navy mb-2">${escapeHtml(it.name)}</h3>
        ${it.description ? `<p class="text-slate-600 mb-3">${escapeHtml(it.description)}</p>` : ""}
        ${price}${duration}
      </div>`;
    })
    .join("\n");

  return `<section class="py-16 bg-white"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`
        : emptyState("No hay servicios configurados.")
    }
  </div></section>`;
}

function renderTeam(c: Record<string, any>): string {
  const { sectionTitle = "Nuestro equipo", members = [] } = c;
  const cards = asArray(members)
    .map((member) => {
      const m = asObject(member);
      return `<div class="text-center">
        ${
          m.photoUrl
            ? `<img src="${escapeHtml(m.photoUrl)}" alt="${escapeHtml(
                m.name
              )}" class="w-24 h-24 rounded-full object-cover mx-auto mb-4" />`
            : ""
        }
        <h3 class="text-lg font-semibold text-navy">${escapeHtml(m.name)}</h3>
        ${m.role ? `<p class="text-brand text-sm">${escapeHtml(m.role)}</p>` : ""}
        ${m.bio ? `<p class="text-slate-600 text-sm mt-2">${escapeHtml(m.bio)}</p>` : ""}
      </div>`;
    })
    .join("\n");

  return `<section class="py-16 bg-slate-50"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">${cards}</div>`
        : emptyState("No hay equipo configurado.")
    }
  </div></section>`;
}

function renderContact(c: Record<string, any>): string {
  const { sectionTitle = "Contacto", phone = "", email = "", address = "", hours = {}, mapEmbedUrl = "" } = c;

  const hoursRows = DAYS.map((day) => {
    const h = asObject(hours)[day];
    if (!h) return null;
    if (h.closed) return `${day}: Cerrado`;
    if (h.open && h.close) return `${day}: ${h.open} - ${h.close}`;
    return null;
  }).filter(Boolean) as string[];

  const contactItems = [
    phone
      ? `<div class="flex items-center gap-3"><span class="text-brand font-semibold">Teléfono</span><a class="text-slate-700 hover:text-brand" href="tel:${escapeHtml(
          phone
        )}">${escapeHtml(phone)}</a></div>`
      : "",
    email
      ? `<div class="flex items-center gap-3"><span class="text-brand font-semibold">Email</span><a class="text-slate-700 hover:text-brand" href="mailto:${escapeHtml(
          email
        )}">${escapeHtml(email)}</a></div>`
      : "",
    address
      ? `<div class="flex items-center gap-3"><span class="text-brand font-semibold">Dirección</span><span class="text-slate-700">${escapeHtml(
          address
        )}</span></div>`
      : "",
    hoursRows.length
      ? `<div><span class="text-brand font-semibold">Horario</span><ul class="text-slate-700 mt-1">${hoursRows
          .map((row) => `<li>${escapeHtml(row)}</li>`)
          .join("")}</ul></div>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const map = mapEmbedUrl
    ? `<div class="mt-6"><iframe src="${escapeHtml(
        mapEmbedUrl
      )}" width="100%" height="400" style="border:0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`
    : "";

  return `<section id="contacto" class="py-16 bg-white"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div class="space-y-4">${contactItems}</div>
      <div>${map}</div>
    </div>
  </div></section>`;
}

function renderBooking(c: Record<string, any>): string {
  const {
    sectionTitle = "Reserva online",
    services = [],
    team = [],
    whatsappText = "Hola, quiero reservar",
  } = c;
  const serviceOptions = asArray(services)
    .map((s) => {
      const svc = asObject(s);
      return `<option value="${escapeHtml(svc.name)}">${escapeHtml(svc.name)}</option>`;
    })
    .join("");
  const teamOptions = asArray(team)
    .map((t) => {
      const member = asObject(t);
      return `<option value="${escapeHtml(member.name)}">${escapeHtml(member.name)}</option>`;
    })
    .join("");

  if (!serviceOptions) {
    return `<section class="py-16 bg-slate-50"><div class="max-w-3xl mx-auto px-4">${heading(
      sectionTitle
    )}${emptyState("No hay servicios configurados para reserva online.")}</div></section>`;
  }

  return `<section class="py-16 bg-slate-50"><div class="max-w-3xl mx-auto px-4">
    ${heading(sectionTitle)}
    <form class="space-y-4 bg-white rounded-xl border border-slate-200 p-6" onsubmit="return false">
      <label class="block"><span class="text-sm font-medium text-slate-700">Servicio</span>
        <select class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">${serviceOptions}</select>
      </label>
      ${
        teamOptions
          ? `<label class="block"><span class="text-sm font-medium text-slate-700">Profesional</span>
        <select class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">${teamOptions}</select>
      </label>`
          : ""
      }
      <label class="block"><span class="text-sm font-medium text-slate-700">Fecha y hora</span>
        <input type="datetime-local" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <button type="button" class="w-full bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg">Confirmar reserva</button>
      <a href="https://wa.me/?text=${encodeURIComponent(
        String(whatsappText)
      )}" class="block text-center text-teal-dark font-medium hover:underline">O escríbenos por WhatsApp</a>
    </form>
  </div></section>`;
}

function renderGallery(c: Record<string, any>): string {
  const { sectionTitle = "Galería", images = [] } = c;
  const items = asArray(images)
    .map((image) => {
      const src = typeof image === "string" ? image : asObject(image).url || asObject(image).src || "";
      const alt = typeof image === "string" ? "" : asObject(image).alt || "";
      if (!src) return "";
      return `<div class="aspect-square rounded-xl bg-slate-100 overflow-hidden"><img src="${escapeHtml(
        src
      )}" alt="${escapeHtml(alt)}" class="w-full h-full object-cover" /></div>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<section class="py-16 bg-white"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      items
        ? `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${items}</div>`
        : emptyState("Aún no hay imágenes en la galería.")
    }
  </div></section>`;
}

function renderBlog(c: Record<string, any>): string {
  const { sectionTitle = "Blog", posts = [] } = c;
  const cards = asArray(posts)
    .map((post) => {
      const p = asObject(post);
      return `<article class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        ${p.image ? `<div class="aspect-video bg-slate-100"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover" /></div>` : ""}
        <div class="p-6">
          <h3 class="text-xl font-semibold text-navy mb-2">${escapeHtml(p.title)}</h3>
          ${p.excerpt ? `<p class="text-slate-600 mb-3">${escapeHtml(p.excerpt)}</p>` : ""}
          ${p.url ? `<a href="${escapeHtml(p.url)}" class="text-brand font-medium hover:underline">Leer más →</a>` : ""}
        </div>
      </article>`;
    })
    .join("\n");

  return `<section class="py-16 bg-slate-50"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`
        : emptyState("Todavía no hay publicaciones.")
    }
  </div></section>`;
}

function renderFaq(c: Record<string, any>): string {
  const { sectionTitle = "Preguntas frecuentes", items = [] } = c;
  const rows = asArray(items)
    .map((item) => {
      const it = asObject(item);
      return `<details class="border-b border-slate-200 py-4">
        <summary class="cursor-pointer font-medium text-navy">${escapeHtml(it.question)}</summary>
        <p class="text-slate-600 mt-2">${escapeHtml(it.answer)}</p>
      </details>`;
    })
    .join("\n");

  return `<section class="py-16 bg-white"><div class="max-w-3xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${rows || emptyState("No hay preguntas frecuentes cargadas.")}
  </div></section>`;
}

function renderReviews(c: Record<string, any>): string {
  const { sectionTitle = "Reseñas de clientes", reviews = [] } = c;
  const stars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => `<span class="${i < rating ? "text-amber-400" : "text-slate-300"}">★</span>`).join("");

  const cards = asArray(reviews)
    .map((review) => {
      const r = asObject(review);
      const rating = typeof r.rating === "number" ? r.rating : 5;
      return `<article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-1 mb-3">${stars(rating)}</div>
        <p class="text-slate-600 mb-4">${escapeHtml(r.comment || "Excelente servicio, muy recomendado.")}</p>
        <p class="text-sm font-semibold text-navy">${escapeHtml(r.author || "Cliente")}</p>
      </article>`;
    })
    .join("\n");

  return `<section class="py-16 bg-slate-50"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`
        : emptyState("Todavía no hay reseñas.")
    }
  </div></section>`;
}

function renderPromos(c: Record<string, any>): string {
  const { sectionTitle = "Promociones vigentes", promotions = [] } = c;
  const cards = asArray(promotions)
    .map((promo) => {
      const p = asObject(promo);
      return `<div class="rounded-xl bg-gradient-to-br from-navy to-slate-800 text-white p-6">
        ${p.badge ? `<span class="inline-block bg-teal-light text-navy text-xs font-bold px-2 py-1 rounded mb-3">${escapeHtml(p.badge)}</span>` : ""}
        <h3 class="text-xl font-semibold mb-2">${escapeHtml(p.title)}</h3>
        ${p.description ? `<p class="text-slate-200 mb-3">${escapeHtml(p.description)}</p>` : ""}
        ${p.discount ? `<p class="text-2xl font-bold text-teal-light">${escapeHtml(p.discount)}</p>` : ""}
        ${p.validUntil ? `<p class="text-sm text-slate-300 mt-2">Válida hasta ${escapeHtml(p.validUntil)}</p>` : ""}
        <a href="#contacto" class="inline-block mt-4 bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2 rounded-lg">Aprovechar</a>
      </div>`;
    })
    .join("\n");

  return `<section class="py-16 bg-white"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`
        : emptyState("No hay promociones vigentes.")
    }
  </div></section>`;
}

function renderCases(c: Record<string, any>): string {
  const { sectionTitle = "Casos de éxito", cases = [] } = c;
  const cards = asArray(cases)
    .map((entry) => {
      const k = asObject(entry);
      const row = (label: string, value: unknown) =>
        value ? `<p class="text-sm text-slate-600"><span class="font-semibold text-navy">${label}:</span> ${escapeHtml(value)}</p>` : "";
      return `<article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-navy mb-2">${escapeHtml(k.title)}</h3>
        ${row("Cliente", k.client)}
        ${row("Desafío", k.problem)}
        ${row("Solución", k.solution)}
        ${row("Resultados", k.results)}
      </article>`;
    })
    .join("\n");

  return `<section class="py-16 bg-slate-50"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${cards}</div>`
        : emptyState("Todavía no hay casos de éxito.")
    }
  </div></section>`;
}

function renderResources(c: Record<string, any>): string {
  const { sectionTitle = "Recursos disponibles", resources = [] } = c;
  const cards = asArray(resources)
    .map((resource) => {
      const r = asObject(resource);
      return `<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-navy mb-2">${escapeHtml(r.title)}</h3>
        ${r.description ? `<p class="text-slate-600 mb-3">${escapeHtml(r.description)}</p>` : ""}
        ${r.url ? `<a href="${escapeHtml(r.url)}" class="text-brand font-medium hover:underline">Descargar →</a>` : ""}
      </div>`;
    })
    .join("\n");

  return `<section class="py-16 bg-white"><div class="max-w-6xl mx-auto px-4">
    ${heading(sectionTitle)}
    ${
      cards
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`
        : emptyState("No hay recursos disponibles.")
    }
  </div></section>`;
}

function renderCta(c: Record<string, any>): string {
  const {
    headline = "¿Listo para empezar?",
    subheadline = "",
    buttonText = "Agendar ahora",
    whatsappText = "Hola, quiero más información",
  } = c;
  return `<section class="py-16 bg-gradient-to-br from-navy to-slate-800 text-white">
    <div class="max-w-3xl mx-auto px-4 text-center">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(headline)}</h2>
      ${subheadline ? `<p class="text-slate-200 mb-8">${escapeHtml(subheadline)}</p>` : ""}
      <a href="#contacto" class="inline-block bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg">${escapeHtml(
        buttonText
      )}</a>
      <a href="https://wa.me/?text=${encodeURIComponent(
        String(whatsappText)
      )}" class="block mt-4 text-teal-light font-medium hover:underline">Escríbenos por WhatsApp</a>
    </div>
  </section>`;
}

/**
 * Renders a single block to an HTML string. Unknown block types render nothing.
 */
export function renderBlockToHtml(block: unknown): string {
  if (!block || typeof block !== "object") return "";
  const { type, content } = block as { type?: string; content?: unknown };
  const c = asObject(content);
  switch (type) {
    case "hero":
      return renderHero(c);
    case "services":
      return renderServices(c);
    case "team":
      return renderTeam(c);
    case "contact":
      return renderContact(c);
    case "booking":
      return renderBooking(c);
    case "gallery":
      return renderGallery(c);
    case "blog":
      return renderBlog(c);
    case "faq":
      return renderFaq(c);
    case "reviews":
      return renderReviews(c);
    case "promos":
      return renderPromos(c);
    case "cases":
      return renderCases(c);
    case "resources":
      return renderResources(c);
    case "cta":
      return renderCta(c);
    default:
      return "";
  }
}

/**
 * Renders an ordered list of blocks to a single HTML string.
 */
export function renderBlocksToHtml(blocks: unknown): string {
  return asArray(blocks)
    .map(renderBlockToHtml)
    .filter(Boolean)
    .join("\n");
}
