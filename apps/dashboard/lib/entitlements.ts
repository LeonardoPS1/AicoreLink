import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { withTenant, asAdmin } from "./tenant-context";
import { logAudit } from "./audit";
import { db } from "./db";

export type Channel = "whatsapp_text" | "whatsapp_voice" | "email" | "social";

export const CHANNELS: Channel[] = ["whatsapp_text", "whatsapp_voice", "email", "social"];

/**
 * Verifica si un tenant tiene un canal activo. Usar esto ANTES de procesar
 * cualquier mensaje entrante en las fases 1-4 (WhatsApp, email, RRSS).
 */
export async function hasFeature(tenantId: string, channel: Channel): Promise<boolean> {
  const row = await withTenant(tenantId, (tx) =>
    tx.tenantChannel.findFirst({ where: { tenantId, channel, enabled: true } })
  );
  return !!row;
}

export async function getTenantChannels(
  tenantId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? db;
  return client.tenantChannel.findMany({ where: { tenantId } });
}

/**
 * Activa o desactiva un modulo para un tenant. Solo debe invocarse desde:
 *   (a) el panel admin (rol dev_aicore), o
 *   (b) el webhook de billing tras un pago confirmado.
 * NUNCA exponer esta funcion directamente a una accion libre del panel
 * cliente sin pasar por el flujo de pago/autorizacion correspondiente.
 *
 * Regla de dependencia: whatsapp_voice no puede activarse sin whatsapp_text.
 */
export async function setFeature(
  tenantId: string,
  channel: Channel,
  enabled: boolean,
  actorId: string
) {
  if (channel === "whatsapp_voice" && enabled) {
    const textActive = await hasFeature(tenantId, "whatsapp_text");
    if (!textActive) {
      throw new Error(
        "No se puede activar whatsapp_voice sin whatsapp_text activo para este tenant."
      );
    }
  }

  const result = await asAdmin((tx) =>
    tx.tenantChannel.upsert({
      where: { tenantId_channel: { tenantId, channel } },
      update: { enabled, activatedAt: enabled ? new Date() : null },
      create: { tenantId, channel, enabled, activatedAt: enabled ? new Date() : null },
    })
  );

  await logAudit({
    tenantId,
    actorId,
    action: enabled ? "channel.activated" : "channel.deactivated",
    meta: { channel },
  });

  return result;
}
