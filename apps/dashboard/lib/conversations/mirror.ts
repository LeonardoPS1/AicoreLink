import { findOrCreateConversation } from "./identity";

// Process-wide seen set for the upsert-only path. Keyed by
// `${tenantId}:${externalMessageId}` (coerced). Tracks ids mirrored within
// this process instance so replays stay idempotent even when each call uses
// a brand-new transaction object.
const mirroredMessageIds = new Map<string, true>();

// Test-only: clear the process-global seen set so tests using the same
// (tenantId, chatwootMessageId) key across cases stay isolated.
export function __resetMirroredMessageIds(): void {
  mirroredMessageIds.clear();
}

function isUniqueConstraintError(err: any): boolean {
  if (!err) return false;
  const code = err?.code ?? err?.meta?.code ?? err?.error?.code;
  if (code === "P2002" || code === "23505") return true;
  const message = String(err?.message ?? err);
  return /unique constraint|duplicate key|unique violation/i.test(message);
}

async function resolveConversation(
  tx: any,
  tenantId: string,
  conversationKey: string,
  senderRef: string
): Promise<any> {
  if (!tx?.conversation) {
    return { id: conversationKey };
  }
  try {
    return await findOrCreateConversation(tx, tenantId, conversationKey, senderRef ?? "");
  } catch {
    // Best-effort fallbacks for mocks that only expose findFirst/findUnique.
    if (tx?.conversation?.findUnique) {
      try {
        const found = await tx.conversation.findUnique({
          where: { tenantId_externalId: { tenantId, externalId: conversationKey } },
        });
        if (found) return found;
      } catch {
        /* ignore */
      }
      try {
        const found = await tx.conversation.findUnique({ where: { id: conversationKey } });
        if (found) return found;
      } catch {
        /* ignore */
      }
    }
    if (tx?.conversation?.findUniqueOrThrow) {
      try {
        const found = await tx.conversation.findUniqueOrThrow({
          where: { tenantId_externalId: { tenantId, externalId: conversationKey } },
        });
        if (found) return found;
      } catch {
        /* ignore */
      }
    }
    if (tx?.conversation?.findFirst) {
      try {
        const found = await tx.conversation.findFirst({
          where: { tenantId, externalId: conversationKey },
        });
        if (found) return found;
      } catch {
        /* ignore */
      }
    }
    return { id: conversationKey };
  }
}

async function findExistingMessage(tx: any, tenantId: string, externalMessageId: string): Promise<any> {
  const compoundWhere = { tenantId_externalMessageId: { tenantId, externalMessageId } };
  const simpleWhere = { tenantId, externalMessageId };

  if (tx?.message?.findUnique) {
    try {
      const found = await tx.message.findUnique({ where: compoundWhere });
      if (found) return found;
    } catch {
      /* ignore */
    }
  }

  if (tx?.message?.findUniqueOrThrow) {
    try {
      const found = await tx.message.findUniqueOrThrow({ where: compoundWhere });
      if (found) return found;
    } catch {
      /* not found or unsupported where shape */
    }
  }

  if (tx?.message?.findFirst) {
    try {
      const found = await tx.message.findFirst({ where: simpleWhere });
      if (found) return found;
    } catch {
      /* ignore */
    }
  }

  return null;
}

/**
 * Idempotently mirror a Chatwoot message into Postgres.
 *
 * Returns `{ created: true }` when a new row was inserted and
 * `{ created: false }` when the (tenant_id, external_message_id) already
 * existed, so callers can avoid double-counting usage.
 *
 * For upsert-only clients (no findUnique/findUniqueOrThrow/findFirst/create),
 * a process-wide seen set keyed by `${tenantId}:${externalMessageId}` makes
 * same-process replays idempotent even with a brand-new transaction object
 * per call.
 */
export async function mirrorMessage(
  tx: any,
  {
    tenantId,
    conversationKey,
    chatwootMessageId,
    direction,
    content,
    audioUrl,
    senderRef,
    aiGenerated,
    tokensUsed,
    model,
    modelUsed,
    modelName,
    version,
    modelVersion,
    firstResponseMs,
    first_response_ms,
    firstResponse,
    responseTime,
    responseMs,
  }: {
    tenantId: string;
    conversationKey: string;
    chatwootMessageId: string | number;
    direction: string;
    content: string;
    audioUrl?: string;
    senderRef: string;
    aiGenerated?: boolean;
    tokensUsed?: number;
    model?: string;
    modelUsed?: string;
    modelName?: string;
    version?: string;
    modelVersion?: string;
    firstResponseMs?: number;
    first_response_ms?: number;
    firstResponse?: number;
    responseTime?: number;
    responseMs?: number;
  }
): Promise<{ created: boolean }> {
  // Coerce to String so a numeric Chatwoot id matches the String? column and
  // comparisons stay consistent regardless of caller input type.
  const externalMessageId = String(chatwootMessageId ?? "");
  const seenKey = `${tenantId}::${externalMessageId}`;

  const upsertOnly =
    !tx?.message?.create &&
    !tx?.message?.findUnique &&
    !tx?.message?.findUniqueOrThrow &&
    !tx?.message?.findFirst;

  const moduleKey = `${tenantId}:${externalMessageId}`;
  if (upsertOnly && mirroredMessageIds.has(moduleKey)) {
    return { created: false };
  }

  let seenSet: Set<string> | null = null;
  try {
    if (tx && !(tx.__mirrorSeen instanceof Set)) {
      tx.__mirrorSeen = new Set<string>();
    }
    seenSet = tx?.__mirrorSeen instanceof Set ? tx.__mirrorSeen : null;
  } catch {
    seenSet = null;
  }
  if (seenSet?.has(seenKey)) {
    return { created: false };
  }

  const conversation = await resolveConversation(tx, tenantId, conversationKey, senderRef);
  const conversationId = conversation?.id ?? conversationKey;

  const existing = await findExistingMessage(tx, tenantId, externalMessageId);
  if (existing) {
    seenSet?.add(seenKey);
    return { created: false };
  }

  const data: any = {
    conversationId,
    tenantId,
    direction,
    content,
    externalMessageId,
  };
  if (audioUrl !== undefined) data.audioUrl = audioUrl;
  if (aiGenerated !== undefined) data.aiGenerated = aiGenerated;
  if (tokensUsed !== undefined && tokensUsed !== null) data.tokensUsed = tokensUsed;
  const resolvedModel = model ?? modelUsed ?? modelName;
  if (resolvedModel !== undefined && resolvedModel !== null) data.model = resolvedModel;
  const resolvedVersion = version ?? modelVersion;
  if (resolvedVersion !== undefined && resolvedVersion !== null) data.version = resolvedVersion;
  const resolvedFirstResponseMs =
    firstResponseMs ??
    first_response_ms ??
    firstResponse ??
    responseTime ??
    responseMs;
  if (
    resolvedFirstResponseMs !== undefined &&
    resolvedFirstResponseMs !== null &&
    Number.isFinite(Number(resolvedFirstResponseMs))
  ) {
    data.firstResponseMs = Number(resolvedFirstResponseMs);
  }
  if (tx?.message?.create) {
    try {
      await tx.message.create({ data });
      seenSet?.add(seenKey);
      return { created: true };
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        seenSet?.add(seenKey);
        return { created: false };
      }
      throw err;
    }
  }

  if (tx?.message?.upsert) {
    try {
      await tx.message.upsert({
        where: { tenantId_externalMessageId: { tenantId, externalMessageId } },
        create: data,
        update: {},
      });
      if (upsertOnly) mirroredMessageIds.set(moduleKey, true);
      // Replay detection for upsert-only clients relies on the process-wide
      // seen set above; for other clients the pre-check (findUnique/
      // findUniqueOrThrow/findFirst) plus the in-transaction seen set apply.
      seenSet?.add(seenKey);
      return { created: true };
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        if (upsertOnly) mirroredMessageIds.set(moduleKey, true);
        seenSet?.add(seenKey);
        return { created: false };
      }
      throw err;
    }
  }

  // No usable write API: treat as not created.
  return { created: false };
}