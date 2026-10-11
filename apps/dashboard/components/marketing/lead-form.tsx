"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField, controlClasses } from "@/components/ui/form-field";
import { leadSchema, type LeadInput } from "@/lib/leads/schema";
import { verticals } from "@/lib/marketing/verticals";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

const FIELDS: { name: keyof LeadInput; label: string; placeholder: string; autoComplete: string }[] = [
  { name: "nombre", label: "Tu nombre", placeholder: "Juan Pérez", autoComplete: "name" },
  { name: "negocio", label: "Tu negocio", placeholder: "Barbería El Corte", autoComplete: "organization" },
];

export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { nombre: "", negocio: "", whatsapp: "", rubro: "", mensaje: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
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

      reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  });

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center rounded-2xl border border-teal/30 bg-white p-8 text-center shadow-[0_24px_60px_-32px_rgba(13,148,136,0.55)]"
      >
        <CheckCircle2 aria-hidden="true" className="size-10 text-teal" />
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
      <h3 className="text-lg font-semibold text-navy">Contanos de tu negocio</h3>
      <p className="mt-1 text-sm text-slate-500">
        Te contactamos en menos de 24 horas. Sin compromiso.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <FormField
            key={field.name}
            id={field.name}
            label={field.label}
            error={errors[field.name]?.message}
          >
            <input
              id={field.name}
              type="text"
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              aria-invalid={errors[field.name] ? true : undefined}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              className={cn(controlClasses, errors[field.name] && "border-red-400")}
              {...register(field.name)}
            />
          </FormField>
        ))}

        <FormField id="whatsapp" label="Tu WhatsApp" error={errors.whatsapp?.message}>
          <input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+54 9 11 5555 5555"
            aria-invalid={errors.whatsapp ? true : undefined}
            aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
            className={cn(controlClasses, errors.whatsapp && "border-red-400")}
            {...register("whatsapp")}
          />
        </FormField>

        <FormField id="rubro" label="Tu rubro" error={errors.rubro?.message}>
          <select
            id="rubro"
            defaultValue=""
            aria-invalid={errors.rubro ? true : undefined}
            aria-describedby={errors.rubro ? "rubro-error" : undefined}
            className={cn(controlClasses, "appearance-none", errors.rubro && "border-red-400")}
            {...register("rubro")}
          >
            <option value="" disabled>
              Elegí una opción
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
          error={errors.mensaje?.message}
          className="sm:col-span-2"
        >
          <textarea
            id="mensaje"
            rows={3}
            placeholder="Ej: pierdo consultas porque no llego a contestar el WhatsApp."
            aria-invalid={errors.mensaje ? true : undefined}
            aria-describedby={
              errors.mensaje ? "mensaje-error" : "mensaje-hint"
            }
            className={cn(controlClasses, "resize-y", errors.mensaje && "border-red-400")}
            {...register("mensaje")}
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
          No pudimos enviar tus datos. Probá de nuevo o escribinos por WhatsApp.
        </p>
      ) : null}
    </form>
  );
}
