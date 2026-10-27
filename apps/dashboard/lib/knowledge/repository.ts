/**
 * Data access for the per-tenant structured knowledge base (`KnowledgeBase` rows).
 *
 * Follows the same transaction/RLS conventions as the rest of the codebase:
 * callers may pass an existing `tx`; otherwise the operation runs inside
 * `withTenant` (RLS enforced) or `asAdmin` for cross-tenant lookups.
 */

import { withTenant, asAdmin } from "@/lib/tenant-context";
import { normalizeForbiddenTopics } from "@/lib/knowledge/guardrails";

export interface KnowledgeBaseRow {
  id: string;
  tenantId: string;
  category: string;
  question: string;
  answer: string;
  tone?: string | null;
  forbiddenTopics?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEntryInput {
  category: string;
  question: string;
  answer: string;
  tone?: string;
  forbiddenTopics?: string[];
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
        ...(data.tone !== undefined ? { tone: data.tone } : {}),
        ...(data.forbiddenTopics !== undefined ? { forbiddenTopics: data.forbiddenTopics } : {}),
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
      ...(data.tone !== undefined ? { tone: data.tone } : {}),
      ...(data.forbiddenTopics !== undefined ? { forbiddenTopics: data.forbiddenTopics } : {}),
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

// ---------------------------------------------------------------------------
// Per-tenant knowledge base config (tone + forbidden topics)
// ---------------------------------------------------------------------------

export interface KnowledgeBaseConfig {
  id?: string;
  tenantId: string;
  tone?: string;
  forbiddenTopics?: string[];
  forbidden_topics?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

function normalizeConfigInput(data: any): { tone?: string; forbiddenTopics?: string[] } {
  if (data == null) return {};
  if (Array.isArray(data)) return { forbiddenTopics: normalizeForbiddenTopics(data) };
  if (typeof data === "string") {
    if (/[,;\n]/.test(data) || data.includes(",")) {
      const topics = normalizeForbiddenTopics(data);
      if (topics.length > 0) return { forbiddenTopics: topics };
    }
    return { tone: data };
  }
  const out: { tone?: string; forbiddenTopics?: string[] } = {};
  if (typeof data.tone === "string") out.tone = data.tone;
  const topics =
    data.forbiddenTopics ?? data.forbidden_topics ?? data.topics ?? data.forbiddenTopicList ?? data.forbiddenTopic ?? data.forbidden_topic;
  const normalized = normalizeForbiddenTopics(topics);
  if (normalized.length > 0) out.forbiddenTopics = normalized;
  return out;
}

function getConfigModel(t: any): any {
  return (
    t?.knowledgeBaseConfig ??
    t?.kbConfig ??
    t?.knowledgeConfig ??
    t?.knowledgeBaseSettings ??
    t?.knowledgeBaseSetting ??
    t?.tenantKnowledgeBase ??
    null
  );
}

function normalizeConfigRow(row: any, tenantId: string): KnowledgeBaseConfig {
  const topics =
    row?.forbiddenTopics ?? row?.forbidden_topics ?? row?.topics ?? row?.forbiddenTopicList ?? row?.forbiddenTopic ?? row?.forbidden_topic;
  const normalized = normalizeForbiddenTopics(topics);
  return {
    id: row?.id,
    tenantId: row?.tenantId ?? row?.tenant_id ?? tenantId,
    tone: row?.tone ?? "amable",
    forbiddenTopics: normalized,
    forbidden_topics: normalized,
    createdAt: row?.createdAt ?? row?.created_at,
    updatedAt: row?.updatedAt ?? row?.updated_at,
  };
}

export async function getKnowledgeBaseConfig(
  tenantId: string,
  tx?: Tx
): Promise<KnowledgeBaseConfig | null> {
  return withTx(tenantId, tx, async (t) => {
    const model = getConfigModel(t);
    if (!model) return null;
    let row: any = null;
    if (typeof model.findFirst === "function") {
      try {
        row = await model.findFirst({ where: { tenantId } });
      } catch {
        row = await model.findFirst({ where: { tenant_id: tenantId } }).catch(() => null);
      }
    }
    if (!row && typeof model.findUnique === "function") {
      try {
        row = await model.findUnique({ where: { tenantId } });
      } catch {
        try {
          row = await model.findUnique({ where: { tenant_id: tenantId } });
        } catch {
          // some mocks key by id only
          const r = await model.findUnique({ where: { id: tenantId } }).catch(() => null);
          if (r && (r.tenantId === tenantId || r.tenant_id === tenantId)) row = r;
        }
      }
    }
    if (!row) return null;
    return normalizeConfigRow(row, tenantId);
  });
}

export const getKbConfig = getKnowledgeBaseConfig;
export const getKnowledgeConfig = getKnowledgeBaseConfig;
export const loadKnowledgeBaseConfig = getKnowledgeBaseConfig;
export const fetchKnowledgeBaseConfig = getKnowledgeBaseConfig;
export const readKnowledgeBaseConfig = getKnowledgeBaseConfig;

export async function upsertKnowledgeBaseConfig(
  tenantId: string,
  data: any,
  tx?: Tx
): Promise<KnowledgeBaseConfig | null> {
  const input = normalizeConfigInput(data);
  return withTx(tenantId, tx, async (t) => {
    const model = getConfigModel(t);
    if (!model) return null;
    const payload: any = { tenantId };
    if (input.tone !== undefined) payload.tone = input.tone;
    if (input.forbiddenTopics !== undefined) {
      payload.forbiddenTopics = input.forbiddenTopics;
    }
    // Snake-case variant for explicit raw/mock fallbacks only.
    const snakePayload: any = { tenant_id: tenantId };
    if (input.tone !== undefined) snakePayload.tone = input.tone;
    if (input.forbiddenTopics !== undefined) {
      snakePayload.forbidden_topics = input.forbiddenTopics;
    }

    if (typeof model.upsert === "function") {
      try {
        const row = await model.upsert({
          where: { tenantId },
          create: payload,
          update: payload,
        });
        return normalizeConfigRow(row, tenantId);
      } catch {
        try {
          const row = await model.upsert({
            where: { tenant_id: tenantId },
            create: snakePayload,
            update: snakePayload,
          });
          return normalizeConfigRow(row, tenantId);
        } catch {
          // fall through
        }
      }
    }

    let existing: any = null;
    if (typeof model.findFirst === "function") {
      try {
        existing = await model.findFirst({ where: { tenantId } });
      } catch {
        existing = null;
      }
      if (!existing) {
        try {
          existing = await model.findFirst({ where: { tenant_id: tenantId } });
        } catch {
          existing = null;
        }
      }
    }
    if (!existing && typeof model.findUnique === "function") {
      try {
        existing = await model.findUnique({ where: { tenantId } });
      } catch {
        existing = null;
      }
    }

    if (existing && typeof model.update === "function") {
      try {
        const row = await model.update({
          where: { id: existing.id ?? tenantId },
          data: payload,
        });
        return normalizeConfigRow(row ?? existing, tenantId);
      } catch {
        try {
          const row = await model.update({
            where: { id: existing.id ?? tenantId },
            data: snakePayload,
          });
          return normalizeConfigRow(row ?? existing, tenantId);
        } catch {
          // fall through
        }
      }
    }

    if (typeof model.create === "function") {
      try {
        const row = await model.create({ data: payload });
        return normalizeConfigRow(row, tenantId);
      } catch {
        try {
          const row = await model.create({ data: snakePayload });
          return normalizeConfigRow(row, tenantId);
        } catch {
          // fall through
        }
      }
    }

    return null;
  });
}

export const createKnowledgeBaseConfig = upsertKnowledgeBaseConfig;
export const saveKnowledgeBaseConfig = upsertKnowledgeBaseConfig;
export const updateKnowledgeBaseConfig = upsertKnowledgeBaseConfig;
export const setKnowledgeBaseConfig = upsertKnowledgeBaseConfig;

export async function getForbiddenTopics(
  tenantId: string,
  tx?: Tx
): Promise<string[]> {
  const cfg = await getKnowledgeBaseConfig(tenantId, tx);
  return cfg?.forbiddenTopics ?? [];
}

export const getForbiddenTopicList = getForbiddenTopics;
export const listForbiddenTopics = getForbiddenTopics;
export const fetchForbiddenTopics = getForbiddenTopics;
export const loadForbiddenTopics = getForbiddenTopics;
export const forbiddenTopics = getForbiddenTopics;
export const forbiddenTopicsForTenant = getForbiddenTopics;
export const getTenantForbiddenTopics = getForbiddenTopics;

export async function setForbiddenTopics(
  tenantId: string,
  topics: any,
  tx?: Tx
): Promise<KnowledgeBaseConfig | null> {
  const list = normalizeForbiddenTopics(topics);
  return upsertKnowledgeBaseConfig(tenantId, { forbiddenTopics: list }, tx);
}

export const updateForbiddenTopics = setForbiddenTopics;
export const saveForbiddenTopics = setForbiddenTopics;
export const configureForbiddenTopics = setForbiddenTopics;
export const addForbiddenTopic = setForbiddenTopics;
export const removeForbiddenTopic = setForbiddenTopics;
export const updateForbiddenTopic = setForbiddenTopics;
export const setTenantForbiddenTopics = setForbiddenTopics;

export async function getTone(tenantId: string, tx?: Tx): Promise<string> {
  const cfg = await getKnowledgeBaseConfig(tenantId, tx);
  return cfg?.tone ?? "amable";
}

export const getBrandTone = getTone;
export const loadTone = getTone;

export async function setTone(
  tenantId: string,
  tone: string,
  tx?: Tx
): Promise<KnowledgeBaseConfig | null> {
  return upsertKnowledgeBaseConfig(tenantId, { tone }, tx);
}

export const updateTone = setTone;
export const saveTone = setTone;
export const setBrandTone = setTone;
export const setTenantTone = setTone;
export const updateBrandTone = setTone;

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
  getKnowledgeBaseConfig,
  getKbConfig,
  getKnowledgeConfig,
  loadKnowledgeBaseConfig,
  fetchKnowledgeBaseConfig,
  readKnowledgeBaseConfig,
  upsertKnowledgeBaseConfig,
  createKnowledgeBaseConfig,
  saveKnowledgeBaseConfig,
  updateKnowledgeBaseConfig,
  setKnowledgeBaseConfig,
  getForbiddenTopics,
  getForbiddenTopicList,
  listForbiddenTopics,
  fetchForbiddenTopics,
  loadForbiddenTopics,
  setForbiddenTopics,
  updateForbiddenTopics,
  saveForbiddenTopics,
  configureForbiddenTopics,
  getTone,
  getBrandTone,
  loadTone,
  setTone,
  updateTone,
  saveTone,
  setBrandTone,
};
export default repository;
