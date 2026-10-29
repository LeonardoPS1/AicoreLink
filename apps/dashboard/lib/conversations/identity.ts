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
  contactRef: string,
  fields?: { model?: any; version?: any; firstResponseMs?: any }
): Promise<any> {
  const f = fields ?? {};
  const createData: Record<string, any> = { tenantId, externalId: key, contactRef };
  if (f.model != null) createData.model = f.model;
  if (f.version != null) createData.version = f.version;
  if (f.firstResponseMs != null && Number.isFinite(Number(f.firstResponseMs))) {
    createData.firstResponseMs = Number(f.firstResponseMs);
  }

  const updateData: Record<string, any> = {};
  if (f.model != null) updateData.model = f.model;
  if (f.version != null) updateData.version = f.version;
  if (f.firstResponseMs != null && Number.isFinite(Number(f.firstResponseMs))) {
    updateData.firstResponseMs = Number(f.firstResponseMs);
  }

  if (tx?.conversation?.upsert) {
    return tx.conversation.upsert({
      where: { tenantId_externalId: { tenantId, externalId: key } },
      create: createData,
      update: updateData,
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

  if (existing) {
    if (Object.keys(updateData).length && tx?.conversation?.update) {
      try {
        await tx.conversation.update({ where: { id: existing.id }, data: updateData });
      } catch {
        /* best-effort */
      }
    }
    return existing;
  }

  return tx.conversation.create({
    data: createData,
  });
}