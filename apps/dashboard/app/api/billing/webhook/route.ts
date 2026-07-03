import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

/**
 * Placeholder de Fase 0. Falta implementar:
 *  1. Verificacion de firma del webhook (Stripe: stripe-signature header;
 *     Flow: firma HMAC propia) usando AICORELINK_BILLING_WEBHOOK_SECRET.
 *  2. Mapeo del evento de pago confirmado -> tenantId + plan/canal a activar.
 *  3. Llamada a setFeature() para activar el modulo correspondiente.
 *
 * Por ahora solo registra el evento crudo en audit_log para poder
 * inspeccionar el payload real del proveedor de pago elegido antes de
 * escribir el parser definitivo.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();

  await logAudit({
    action: "billing.webhook_received_raw",
    meta: { body: raw.slice(0, 5000) }, // truncado por seguridad/tamano
  });

  return NextResponse.json({ received: true });
}
