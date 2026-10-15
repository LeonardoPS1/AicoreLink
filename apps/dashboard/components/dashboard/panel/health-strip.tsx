import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { HealthStatus, SystemHealth } from "@/lib/panel/health";

const DATE_TIME = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

/**
 * The status of the five services of the design (§6): Postgres, n8n, Ollama,
 * the WhatsApp delivery and site publishing. A service whose setting is missing
 * is shown as "sin datos", never green and never red: the probe did not fail, it
 * was never configured.
 */
const STATUS: Record<HealthStatus, { label: string; variant: BadgeVariant; className?: string }> = {
  ok: { label: "operativo", variant: "teal" },
  degradado: { label: "degradado", variant: "amber" },
  caido: { label: "caído", variant: "neutral", className: "bg-red-100 text-red-700" },
  sin_datos: { label: "sin datos", variant: "neutral" },
};

export interface HealthStripProps {
  health: SystemHealth;
}

export function HealthStrip({ health }: HealthStripProps) {
  return (
    <section data-testid="health-strip" aria-labelledby="health-strip-title">
      <h2 id="health-strip-title" className="text-lg font-semibold text-navy">
        Estado del sistema
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {health.services.map((service) => {
          const status = STATUS[service.status];
          return (
            <li
              key={service.key}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">{service.label}</span>
                <Badge variant={status.variant} className={status.className}>
                  {status.label}
                </Badge>
              </div>
              {service.detail ? (
                <p className="mt-2 text-xs text-slate-500">{service.detail}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">
                Última verificación:{" "}
                <time dateTime={service.checkedAt}>
                  {DATE_TIME.format(new Date(service.checkedAt))}
                </time>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
