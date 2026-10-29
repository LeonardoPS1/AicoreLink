import { asAdmin } from "@/lib/tenant-context";

export async function resolveTenantByPhoneNumberId(
  phoneNumberId: string
): Promise<string | null> {
  return asAdmin(async (tx) => {
    const cred = await tx.channelCredential.findFirst({
      where: {
        provider: "meta_cloud_api",
        externalId: phoneNumberId,
      },
      select: { tenantId: true },
    });
    return cred?.tenantId ?? null;
  });
}

export async function resolveTenantByChatwootInbox(
  inboxId: string
): Promise<{ tenantId: string; channelId: string } | null> {
  return asAdmin(async (tx) => {
    const cred = await tx.channelCredential.findFirst({
      where: {
        provider: "chatwoot",
        externalId: inboxId,
        enabled: true,
      },
      select: { tenantId: true, id: true, enabled: true },
    });
    if (!cred) return null;
    const loose = cred as { channelId?: string; channel?: string };
    return {
      tenantId: cred.tenantId,
      channelId: loose.channelId ?? loose.channel ?? cred.id,
    };
  });
}
