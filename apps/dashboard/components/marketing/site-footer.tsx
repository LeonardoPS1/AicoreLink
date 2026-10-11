import { copy, whatsappUrl } from "@/lib/marketing/copy";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-teal text-sm font-bold text-white"
              >
                A
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                {copy.brand.name}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {copy.footer.tagline}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">{copy.footer.ecosystem.title}</h2>
            <ul className="mt-4 space-y-3">
              {copy.footer.ecosystem.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 transition-colors duration-150 hover:text-teal-light"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">{copy.footer.contact.title}</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={whatsappUrl(copy.stickyWhatsApp.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 transition-colors duration-150 hover:text-teal-light"
                >
                  {copy.footer.contact.links[0].label}
                </a>
              </li>
              <li>
                <a
                  href="#contacto"
                  className="text-sm text-slate-400 transition-colors duration-150 hover:text-teal-light"
                >
                  {copy.footer.contact.links[1].label}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.footer.legal.replace(String(new Date().getFullYear()), String(year))}</p>
          <p>{copy.brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
