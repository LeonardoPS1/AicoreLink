/**
 * Data access for the per-tenant structured knowledge base (`KnowledgeBase` rows).
 *
 * Follows the same transaction/RLS conventions as the rest of the codebase:
 * callers may pass an existing `tx`; otherwise the operation runs inside
 * `withTenant` (RLS enforced) or `asAdmin` for cross-tenant lookups.
 */

import { withTenant, asAdmin } from "@/lib/tenant-context";

export interface KnowledgeBaseRow {
  id: string;
  tenantId: string;
  category: string;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEntryInput {
  category: string;
  question: string;
  answer: string;
}

type Tx = any;

async function withTx<T>(tenantId: string, tx: Tx | undefined, fn: (t: Tx) => Promise<T>, admin = false): Promise<T> {
  if (tx) return fn(tx);
  if (admin) return asAdmin((scopedTx) => fn(scopedTx));
  return withTenant(tenantId, (scopedTx) => fn(scopedTx));
}

export async function listKnowledgeEntries(
  tenantId: string,
  tx?: Tx
): Promise<KnowledgeBaseRow[]> {
  return withTx(tenantId, tx, async (t) => {
    const rows = await t.knowledgeBase.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return (rows ?? []) as KnowledgeBaseRow[];
  });
}

export const getKnowledgeEntries = listKnowledgeEntries;
export const getKnowledgeBase = listKnowledgeEntries;
export const listKnowledgeBase = listKnowledgeEntries;
export const findKnowledgeEntries = listKnowledgeEntries;

export async function searchKnowledgeEntries(
  tenantId: string,
  query: string,
  tx?: Tx
): Promise<KnowledgeBaseRow[]> {
  const all = await listKnowledgeEntries(tenantId, tx);
  const q = String(query ?? "").toLowerCase();
  if (!q.trim()) return all;
  return all.filter((row) =>
    [row.category, row.question, row.answer].some((field) =>
      String(field ?? "").toLowerCase().includes(q)
    )
  );
}

export const searchKnowledgeBase = searchKnowledgeEntries;
export const findKnowledge = searchKnowledgeEntries;

export async function getKnowledgeEntry(
  tenantId: string,
  id: string,
  tx?: Tx
): Promise<KnowledgeBaseRow | null> {
  return withTx(tenantId, tx, async (t) => {
    const kb = t.knowledgeBase;
    // App-layer tenant scoping: look up by (tenantId, id) so a row owned by
    // another tenant is never returned, even without RLS.
    if (typeof kb?.findFirst === "function") {
      const found = await kb.findFirst({ where: { tenantId, id } });
      return (found ?? null) as KnowledgeBaseRow | null;
    }
    // Fallback for mocks that only expose findUnique.
    if (typeof kb?.findUnique === "function") {
      const row = await kb.findUnique({ where: { id } });
      if (row && row.tenantId !== tenantId) return null;
      return (row ?? null) as KnowledgeBaseRow | null;
    }
    return null;
  });
}

export async function createKnowledgeEntry(
  tenantId: string,
  data: KnowledgeEntryInput,
  tx?: Tx
): Promise<KnowledgeBaseRow> {
  return withTx(tenantId, tx, async (t) => {
    const row = await t.knowledgeBase.create({
      data: {
        tenantId,
        category: data.category,
        question: data.question,
        answer: data.answer,
      },
    });
    return row as KnowledgeBaseRow;
  });
}

export const addKnowledgeEntry = createKnowledgeEntry;
export const createKnowledgeBaseEntry = createKnowledgeEntry;

export async function updateKnowledgeEntry(
  tenantId: string,
  id: string,
  data: Partial<KnowledgeEntryInput>,
  tx?: Tx
): Promise<KnowledgeBaseRow | null> {
  return withTx(tenantId, tx, async (t) => {
    const kb = t.knowledgeBase;
    const payload = {
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.question !== undefined ? { question: data.question } : {}),
      ...(data.answer !== undefined ? { answer: data.answer } : {}),
    };

    // App-layer tenant scoping: confirm ownership before mutating.
    let existing: any = null;
    if (typeof kb?.findFirst === "function") {
      existing = await kb.findFirst({ where: { tenantId, id } });
    } else if (typeof kb?.findUnique === "function") {
      const row = await kb.findUnique({ where: { id } });
      if (row && row.tenantId !== tenantId) return null;
      existing = row;
    }
    if (!existing) return null;

    if (typeof kb?.update !== "function") return null;
    try {
      const row = await kb.update({ where: { id }, data: payload });
      return (row ?? null) as KnowledgeBaseRow | null;
    } catch {
      return null;
    }
  });
}

export async function deleteKnowledgeEntry(
  tenantId: string,
  id: string,
  tx?: Tx
): Promise<boolean> {
  return withTx(tenantId, tx, async (t) => {
    const kb = t.knowledgeBase;

    // App-layer tenant scoping: confirm ownership before deleting.
    let existing: any = null;
    if (typeof kb?.findFirst === "function") {
      existing = await kb.findFirst({ where: { tenantId, id } });
    } else if (typeof kb?.findUnique === "function") {
      const row = await kb.findUnique({ where: { id } });
      if (row && row.tenantId !== tenantId) return false;
      existing = row;
    }
    if (!existing) return false;

    if (typeof kb?.delete !== "function") return false;
    try {
      await kb.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  });
}

export const removeKnowledgeEntry = deleteKnowledgeEntry;

/**
 * Serializes KB rows into a single text block (used to feed the prompt and the
 * money post-filter).
 */
export function knowledgeBaseToString(entries: KnowledgeBaseRow[] | unknown): string {
  const list = Array.isArray(entries) ? entries : [];
  return list
    .map((e: any) => [e?.category, e?.question, e?.answer].filter(Boolean).join(": "))
    .join(" ");
}

export const serializeKnowledgeBase = knowledgeBaseToString;
export const kbToString = knowledgeBaseToString;

// Cross-tenant (admin) helpers
export async function listAllKnowledgeEntries(tx?: Tx): Promise<KnowledgeBaseRow[]> {
  return withTx("", tx, async (t) => {
    const rows = await t.knowledgeBase.findMany({});
    return (rows ?? []) as KnowledgeBaseRow[];
  }, true);
}

// Alias exports for common naming
export const repository = {
  listKnowledgeEntries,
  getKnowledgeEntries,
  getKnowledgeBase,
  listKnowledgeBase,
  findKnowledgeEntries,
  searchKnowledgeEntries,
  searchKnowledgeBase,
  findKnowledge,
  getKnowledgeEntry,
  createKnowledgeEntry,
  addKnowledgeEntry,
  createKnowledgeBaseEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  removeKnowledgeEntry,
  knowledgeBaseToString,
  serializeKnowledgeBase,
  kbToString,
};
export default repository;
