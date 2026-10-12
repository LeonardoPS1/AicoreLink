"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { trackFormSubmit } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { FormField, controlClasses } from "@/components/ui/form-field";
import { leadSchema, type LeadInput } from "@/lib/leads/schema";
import { verticals } from "@/lib/marketing/verticals";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = Partial<Record<keyof LeadInput, string>>;

const EMPTY: LeadInput = { nombre: "", negocio: "", whatsapp: "", rubro: "", mensaje: "" };

const FIELDS: { name: keyof LeadInput; label: string; placeholder: string; autoComplete: string }[] = [
  { name: "nombre", label: "Tu nombre", placeholder: "Juan Pérez", autoComplete: "name" },
  { name: "negocio", label: "Tu negocio", placeholder: "Barbería El Corte", autoComplete: "organization" },
];

/**
 * Lead capture form. Deliberately dependency-free (no react-hook-form): this is
 * the only place the landing touches heavy form machinery, and dropping it cut
 * the biggest client-side script chunk and the longest main-thread task in the
 * Lighthouse budget. Validation runs on submit against the same Zod schema the
 * API route uses (lib/leads/schema.ts), so client and server agree on the rules.
 */
export function LeadForm() {
  const [values, setValues] = useState<LeadInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  function update(name: keyof LeadInput) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }));

      // The visitor is fixing the field; clear its error right away.
      if (fieldErrors[name]) {
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = leadSchema.safeParse(values);

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(flattened).map(([key, messages]) => [key, messages?.[0]]),
        ),
      );
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`Lead submission failed with status ${response.status}`);
      }

      setValues(EMPTY);
      setFieldErrors({});
      setStatus("success");
      trackFormSubmit(parsed.data.rubro || undefined);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center rounded-2xl border border-teal/30 bg-white p-8 text-center shadow-[0_24px_60px_-32px_rgba(13,148,136,0.55)]"
      >
        <CheckCircle2 aria-hidden="true" className="size-10 text-teal-dark" />
        <h3 className="mt-4 text-lg font-semibold text-navy">¡Recibimos tus datos!</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Te escribimos por WhatsApp en las próximas horas para coordinar el diagnóstico.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-white p-6 text-left shadow-[0_24px_60px_-32px_rgba(15,23,42,0.65)] sm:p-8"
    >
      <h3 className="text-lg font-semibold text-navy">Cuéntanos de tu negocio</h3>
      <p className="mt-1 text-sm text-slate-500">
        Te contactamos en menos de 24 horas. Sin compromiso.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <FormField
            key={field.name}
            id={field.name}
            label={field.label}
            error={fieldErrors[field.name]}
          >
            <input
              id={field.name}
              type="text"
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={update(field.name)}
              aria-invalid={fieldErrors[field.name] ? true : undefined}
              aria-describedby={fieldErrors[field.name] ? `${field.name}-error` : undefined}
              className={cn(controlClasses, fieldErrors[field.name] && "border-red-400")}
            />
          </FormField>
        ))}

        <FormField id="whatsapp" label="Tu WhatsApp" error={fieldErrors.whatsapp}>
          <input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+56 9 5555 5555"
            value={values.whatsapp}
            onChange={update("whatsapp")}
            aria-invalid={fieldErrors.whatsapp ? true : undefined}
            aria-describedby={fieldErrors.whatsapp ? "whatsapp-error" : undefined}
            className={cn(controlClasses, fieldErrors.whatsapp && "border-red-400")}
          />
        </FormField>

        <FormField id="rubro" label="Tu rubro" error={fieldErrors.rubro}>
          <select
            id="rubro"
            value={values.rubro}
            onChange={update("rubro")}
            aria-invalid={fieldErrors.rubro ? true : undefined}
            aria-describedby={fieldErrors.rubro ? "rubro-error" : undefined}
            className={cn(controlClasses, "appearance-none", fieldErrors.rubro && "border-red-400")}
          >
            <option value="" disabled>
              Elige una opción
            </option>
            {verticals.map((vertical) => (
              <option key={vertical.id} value={vertical.id}>
                {vertical.singular}
              </option>
            ))}
            <option value="otro">Otro rubro</option>
          </select>
        </FormField>

        <FormField
          id="mensaje"
          label="¿Qué te gustaría resolver?"
          hint="Opcional"
          error={fieldErrors.mensaje}
          className="sm:col-span-2"
        >
          <textarea
            id="mensaje"
            rows={3}
            placeholder="Ej: pierdo consultas porque no llego a contestar el WhatsApp."
            value={values.mensaje}
            onChange={update("mensaje")}
            aria-invalid={fieldErrors.mensaje ? true : undefined}
            aria-describedby={fieldErrors.mensaje ? "mensaje-error" : "mensaje-hint"}
            className={cn(controlClasses, "resize-y", fieldErrors.mensaje && "border-red-400")}
          />
        </FormField>
      </div>

      <Button type="submit" size="lg" disabled={status === "submitting"} className="mt-6 w-full">
        {status === "submitting" ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <Send aria-hidden="true" className="size-4" />
            Solicitar diagnóstico gratis
          </>
        )}
      </Button>

      {status === "error" ? (
        <p role="alert" className="mt-3 text-center text-sm font-medium text-red-600">
          No pudimos enviar tus datos. Prueba de nuevo o escríbenos por WhatsApp.
        </p>
      ) : null}
    </form>
  );
}