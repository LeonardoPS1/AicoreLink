"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import { WhatsAppGlyph } from "@/components/marketing/whatsapp-glyph";
import { buttonClasses } from "@/components/ui/button";
import { FormField, controlClasses } from "@/components/ui/form-field";
import {
  copy,
  formatCLP,
  presetWhatsappUrl,
  type CalculatorField,
} from "@/lib/marketing/copy";
import { computeLostRevenue, type LostRevenueInput } from "@/lib/tools/calculator";
import { trackToolsFinish } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type FieldValues = Record<keyof LostRevenueInput, string>;

const EMPTY: FieldValues = {
  messagesPerWeek: "",
  unansweredPct: "",
  avgTicketCLP: "",
  closeRate: "",
};

/** HTML input attributes that match how the visitor reads each field's unit. */
function inputAttributes(unit: CalculatorField["unit"]) {
  switch (unit) {
    case "percent":
      return { min: 0, max: 100, step: 1 };
    case "perTen":
      return { min: 0, max: 10, step: 1 };
    case "clp":
      return { min: 0, step: 1000 };
    default:
      return { min: 0, step: 1 };
  }
}

function toNumber(raw: string): number {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

/**
 * Maps the raw field strings to the calculator's numeric input. The closing-rate
 * field is answered "of every 10", so it is scaled by 10 into the model's 0–100
 * percentage (a visitor who types "3" means a 30% close rate).
 */
function toLostRevenueInput(values: FieldValues): LostRevenueInput {
  return {
    messagesPerWeek: toNumber(values.messagesPerWeek),
    unansweredPct: toNumber(values.unansweredPct),
    avgTicketCLP: toNumber(values.avgTicketCLP),
    closeRate: toNumber(values.closeRate) * 10,
  };
}

/**
 * Public lead-cost calculator ("¿Cuánto te cuesta no responder?"). Client-side
 * only: nothing the visitor types leaves the browser — the estimate is computed
 * locally from `computeLostRevenue`, and the only outbound action is the
 * pre-filled WhatsApp message the visitor chooses to send.
 *
 * The result is hidden until all four fields carry a value and the estimate is
 * positive, so a partly-filled form never flashes a misleading "$0".
 */
export function LeadCostCalculator() {
  const [values, setValues] = useState<FieldValues>(EMPTY);

  function update(name: keyof FieldValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }));
    };
  }

  const allFilled = copy.calculator.fields.every((field) => values[field.name].trim() !== "");
  const monthlyLostCLP = allFilled ? computeLostRevenue(toLostRevenueInput(values)).monthlyLostCLP : 0;
  const hasResult = allFilled && monthlyLostCLP > 0;

  // Emit tools_finish programmatically when the result appears (R48: tracker treats
  // data-track as click, but the result appears without a click).
  useEffect(() => {
    if (hasResult) {
      trackToolsFinish("calculadora", { monthlyLost: monthlyLostCLP });
    }
  }, [hasResult, monthlyLostCLP]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {copy.calculator.fields.map((field, index) => {
          const attributes = inputAttributes(field.unit);

          return (
            <FormField key={field.name} id={field.name} label={field.label} hint={field.hint}>
              <div className="relative">
                {field.unit === "clp" ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-400"
                  >
                    $
                  </span>
                ) : null}

                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  min={attributes.min}
                  max={attributes.max}
                  step={attributes.step}
                  placeholder={field.placeholder}
                  value={values[field.name]}
                  onChange={update(field.name)}
                  // Analytics hook prepared for E1.7, the owner of the funnel
                  // wiring: the first field the visitor touches marks the start.
                  data-track={index === 0 ? "tools_start" : undefined}
                  aria-describedby={field.hint ? `${field.name}-hint` : undefined}
                  className={cn(controlClasses, field.unit === "clp" && "pl-7")}
                />

                {field.unit === "percent" ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-400"
                  >
                    %
                  </span>
                ) : null}
              </div>
            </FormField>
          );
        })}
      </div>

      <div aria-live="polite" role="status" className="mt-6">
        {hasResult ? (
          <div className="rounded-xl border border-teal/25 bg-teal/5 p-5">
            <p
              data-monthly-lost={monthlyLostCLP}
              className="text-lg font-semibold text-navy"
            >
              {copy.calculator.resultTemplate.replace("{amount}", formatCLP(monthlyLostCLP))}
            </p>
            <p className="mt-1 text-sm text-slate-600">{copy.calculator.disclaimer}</p>
          </div>
        ) : null}
      </div>

      {hasResult ? (
        <a
          href={presetWhatsappUrl("calculadora", { amountCLP: monthlyLostCLP })}
          data-label="calculadora"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("primary", "lg", "mt-6 w-full")}
        >
          <WhatsAppGlyph className="size-5" />
          {copy.calculator.ctaLabel}
        </a>
      ) : null}
    </div>
  );
}
