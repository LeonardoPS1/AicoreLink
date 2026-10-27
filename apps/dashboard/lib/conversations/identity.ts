/**
 * Single conversation identity for a contact.
 *
 * A contact is identified by a deterministic key built from the tenant and the
 * upstream (Chatwoot) conversation id, so the same contact always maps to the
 * same row in Postgres regardless of how many messages arrive.
 */

export function conversationKey(
  tenantId: string,
  chatwootConversationId: string | number
): string {
  return `cw_${tenantId}_${chatwootConversationId}`;
}

/**
 * Upsert a conversation by (tenant_id, external_id). Idempotent: calling twice
 * with the same key returns the same row instead of creating a duplicate.
 */
export async function findOrCreateConversation(
  tx: any,
  tenantId: string,
  key: string,
  contactRef: string
): Promise<any> {
  if (tx?.conversation?.upsert) {
    return tx.conversation.upsert({
      where: { tenantId_externalId: { tenantId, externalId: key } },
      create: { tenantId, externalId: key, contactRef },
      update: {},
    });
  }

  // Fallback for clients/mocks that only expose findFirst/findUnique + create.
  const existing =
    (await tx?.conversation?.findUnique?.({
      where: { tenantId_externalId: { tenantId, externalId: key } },
    })) ??
    (await tx?.conversation?.findFirst?.({
      where: { tenantId, externalId: key },
    }));

  if (existing) return existing;

  return tx.conversation.create({
    data: { tenantId, externalId: key, contactRef },
  });
}