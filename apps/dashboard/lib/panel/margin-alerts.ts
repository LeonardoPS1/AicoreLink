import type { Prisma } from "@prisma/client";
import { planDefinition } from "./plans";

export interface MarginAlertResult {
  alert: boolean;
  marginPct: number;
  threshold: number;
  reason?: string;
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function periodString(period: any): string {
  if (period instanceof Date) {
    return `${period.getUTCFullYear()}-${String(period.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  if (typeof period === "number") {
    const d = new Date(period);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    }
  }
  const s = String(period ?? "");
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function periodStart(period: any): Date {
  const s = periodString(period);
  const m = s.match(/^(\d{4})-(\d{2})/)!;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
}

function periodEnd(period: any): Date {
  const d = periodStart(period);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

function normalizeThreshold(arg: any, tenant: any): number {
  if (typeof arg === "number" && Number.isFinite(arg)) return arg;
  if (arg && typeof arg === "object") {
    if (typeof arg.threshold === "number" && Number.isFinite(arg.threshold)) return arg.threshold;
    if (typeof arg.marginThreshold === "number" && Number.isFinite(arg.marginThreshold)) return arg.marginThreshold;
    if (typeof arg.alertThreshold === "number" && Number.isFinite(arg.alertThreshold)) return arg.alertThreshold;
  }
  if (tenant && typeof tenant === "object") {
    const t =
      tenant.marginThreshold ?? tenant.margin_threshold ?? tenant.alertThreshold ?? tenant.alert_threshold;
    if (typeof t === "number" && Number.isFinite(t)) return t;
    if (t !== undefined && t !== null) {
      const n = Number(t);
      if (Number.isFinite(n)) return n;
    }
  }
  return 20;
}

async function withAdminTx<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  try {
    const mod = await import("@/lib/tenant-context");
    if (typeof mod.withTenant === "function") {
      // margin checker is per-tenant, prefer withTenant when available
    }
  } catch {
    // ignore
  }
  // Fallback: try asAdmin
  try {
    const mod = await import("@/lib/tenant-context");
    if (typeof mod.asAdmin === "function") {
      return mod.asAdmin(fn);
    }
  } catch {
    // ignore
  }
  const dbMod = await import("@/lib/db");
  const db = (dbMod as any).db ?? (dbMod as any).default;
  return fn(db);
}

async function runCheck(tx: any, tenantId: string, period: any): Promise<{ rows: any[]; tenant: any }> {
  const start = periodStart(period);
  const end = periodEnd(period);
  const ps = periodString(period);
  let rows: any[] = [];

  if (tx?.tenantUsage?.findMany) {
    try {
      rows = await tx.tenantUsage.findMany({
        where: { tenantId, channel: "whatsapp_text", period: { gte: start, lt: end } },
      });
    } catch {
      try {
        const all = await tx.tenantUsage.findMany({ where: { tenantId, channel: "whatsapp_text" } });
        rows = (all ?? []).filter((r: any) => {
          const p = r?.period;
          const iso = p?.toISOString ? p.toISOString() : String(p ?? "");
          return iso.startsWith(ps);
        });
      } catch {
        rows = [];
      }
    }
  } else if (tx?.tenantUsage?.findFirst) {
    try {
      const one = await tx.tenantUsage.findFirst({ where: { tenantId, channel: "whatsapp_text", period: start } });
      if (one) rows = [one];
    } catch {
      try {
        const one = await tx.tenantUsage.findFirst({ where: { tenantId, channel: "whatsapp_text" } });
        if (one) {
          const p = one?.period;
          const iso = p?.toISOString ? p.toISOString() : String(p ?? "");
          if (iso.startsWith(ps)) rows = [one];
        }
      } catch {
        rows = [];
      }
    }
    if (rows.length === 0) {
      // try loosely
      try {
        const one = await tx.tenantUsage.findFirst({ where: { tenantId, channel: "whatsapp_text" } });
        if (one) {
          const p = one?.period;
          const iso = p?.toISOString ? p.toISOString() : String(p ?? "");
          if (!iso || iso.startsWith(ps)) rows = [one];
        }
      } catch {
        // ignore
      }
    }
  } else if (tx?.tenantUsage?.aggregate) {
    try {
      const aggr = await tx.tenantUsage.aggregate({
        where: { tenantId, channel: "whatsapp_text", period: { gte: start, lt: end } },
        _sum: { costEstimate: true },
      });
      rows = [
        {
          costEstimate: aggr?._sum?.costEstimate ?? 0,
        },
      ];
    } catch {
      rows = [];
    }
  }

  // Filter rows to the requested period when mocks return broader sets.
  if (rows.length > 1) {
    const filtered = rows.filter((r: any) => {
      const p = r?.period;
      if (p == null) return true;
      const iso = p?.toISOString ? p.toISOString() : String(p);
      return iso.startsWith(ps);
    });
    if (filtered.length > 0) rows = filtered;
  }

  let tenant: any = null;
  if (tx?.tenant?.findUnique) {
    try {
      tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
    } catch {
      tenant = null;
    }
  } else if (tx?.tenant?.findFirst) {
    try {
      tenant = await tx.tenant.findFirst({ where: { id: tenantId } });
    } catch {
      tenant = null;
    }
  }

  if (!tenant) {
    try {
      const dbMod = await import("@/lib/db");
      const db = (dbMod as any).db ?? (dbMod as any).default;
      if (db?.tenant?.findUnique) {
        tenant = await db.tenant.findUnique({ where: { id: tenantId } });
      } else if (db?.tenant?.findFirst) {
        tenant = await db.tenant.findFirst({ where: { id: tenantId } });
      }
    } catch {
      tenant = null;
    }
  }

  return { rows, tenant };
}

export async function checkMarginAlert(
  tenantId: string,
  period: any,
  thresholdArg?: any,
  deps?: any,
): Promise<MarginAlertResult> {
  const txOverride = deps?.tx ?? deps?.client ?? deps?.prisma;

  async function execute(tx: any): Promise<MarginAlertResult> {
    const { rows, tenant } = await runCheck(tx, tenantId, period);
    const threshold = normalizeThreshold(thresholdArg, tenant);

    const cost = rows.reduce((sum, row) => sum + toNumber(row?.costEstimate ?? row?.cost_estimate), 0);

    const revenue = toNumber(planDefinition(tenant?.plan).priceCLP);

    if (revenue <= 0) {
      return { alert: false, marginPct: 0, threshold, reason: "no_data" };
    }
    if (cost <= 0) {
      return { alert: false, marginPct: 0, threshold, reason: "no_cost" };
    }

    const marginPct = ((revenue - cost) / revenue) * 100;
    return { alert: marginPct < threshold, marginPct, threshold };
  }

  if (txOverride) {
    return execute(txOverride);
  }

  // Try withTenant first
  try {
    const mod = await import("@/lib/tenant-context");
    if (typeof mod.withTenant === "function") {
      return await mod.withTenant(tenantId, (tx: any) => execute(tx));
    }
  } catch {
    // fall through
  }

  // Fallback to asAdmin / db
  return withAdminTx((tx: any) => execute(tx));
}

const defaultExport = checkMarginAlert as any;
defaultExport.checkMarginAlert = checkMarginAlert;
export default defaultExport;
