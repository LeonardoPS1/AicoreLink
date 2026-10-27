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
      } as any,
      select: { tenantId: true, id: true },
    });
    if (!cred) return null;
    return {
      tenantId: cred.tenantId,
      channelId: cred.id ?? cred.channelId ?? cred.channel,
    };
  });
}