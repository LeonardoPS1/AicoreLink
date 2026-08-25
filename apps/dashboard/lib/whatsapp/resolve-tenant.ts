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