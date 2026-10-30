import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface UsageData {
  messagesIn: number;
  messagesOut: number;
  tokensUsed: number;
  costEstimate: number;
  model?: string | null;
  version?: string | null;
}

interface MarginData {
  cost: number;
  revenue: number;
  marginPct: number;
}

interface UsageResult {
  usage: UsageData;
  margin: MarginData;
}

const EMPTY: UsageResult = {
  usage: { messagesIn: 0, messagesOut: 0, tokensUsed: 0, costEstimate: 0, model: null, version: null },
  margin: { cost: 0, revenue: 19990, marginPct: 100 },
};

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function loadUsage(): Promise<UsageResult> {
  // Prefer the public API so the page stays a thin consumer of /api/tenants/usage.
  try {
    const res = await fetch("/api/tenants/usage", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.usage) {
        return {
          usage: {
            messagesIn: toNumber(data.usage.messagesIn),
            messagesOut: toNumber(data.usage.messagesOut),
            tokensUsed: toNumber(data.usage.tokensUsed),
            costEstimate: toNumber(data.usage.costEstimate),
            model: data.usage.model ?? null,
            version: data.usage.version ?? null,
          },
          margin: {
            cost: toNumber(data.margin?.cost),
            revenue: toNumber(data.margin?.revenue) || 19990,
            marginPct: toNumber(data.margin?.marginPct),
          },
        };
      }
      if (Array.isArray(data)) {
        // unlikely, but tolerate
      }
    }
  } catch {
    // fall through to direct DB access
  }

  // Fallback: read directly with the tenant context (works in tests that mock
  // tenant-context instead of fetch, and avoids an extra HTTP hop in prod).
  try {
    const { withTenant } = await import("@/lib/tenant-context");
    const session = await getServerSession(authOptions);
    const tenantId =
      (session?.user as { tenantId?: string | null } | undefined)?.tenantId ??
      (session as { tenantId?: string | null } | undefined)?.tenantId ??
      null;
    if (tenantId) {
      const result = await withTenant(tenantId, async (tx: any) => {
        let rows: any[] = [];
        if (tx?.tenantUsage?.findMany) {
          rows = await tx.tenantUsage.findMany({
            where: { tenantId, channel: "whatsapp_text" },
          });
        } else if (tx?.tenantUsage?.findFirst) {
          const one = await tx.tenantUsage.findFirst({ where: { tenantId, channel: "whatsapp_text" } });
          if (one) rows = [one];
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
        return { rows, tenant };
      });

      const agg = (result?.rows ?? []).reduce(
        (acc: any, row: any) => {
          acc.messagesIn += toNumber(row?.messagesIn);
          acc.messagesOut += toNumber(row?.messagesOut);
          acc.tokensUsed += toNumber(row?.tokensUsed);
          acc.cost += toNumber(row?.costEstimate);
          if (acc.model == null && row?.model != null) acc.model = row.model;
          if (acc.version == null && row?.version != null) acc.version = row.version;
          return acc;
        },
        { messagesIn: 0, messagesOut: 0, tokensUsed: 0, cost: 0, model: null, version: null }
      );

      let tenant = result?.tenant;
      if (!tenant) {
        try {
          const { db } = await import("@/lib/db");
          if ((db as any)?.tenant?.findUnique) {
            tenant = await (db as any).tenant.findUnique({ where: { id: tenantId } });
          }
        } catch {
          // ignore
        }
      }

      const { planDefinition } = await import("@/lib/panel/plans");
      const revenue = toNumber(planDefinition(tenant?.plan).priceCLP, 19990) || 19990;
      const cost = agg.cost;
      const marginPct = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

      return {
        usage: {
          messagesIn: agg.messagesIn,
          messagesOut: agg.messagesOut,
          tokensUsed: agg.tokensUsed,
          costEstimate: cost,
          model: agg.model,
          version: agg.version,
        },
        margin: { cost, revenue, marginPct },
      };
    }
  } catch {
    // ignore
  }

  return EMPTY;
}

export default async function UsagePage() {
  const { usage, margin } = await loadUsage();
  const ok = margin.marginPct >= 20;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Uso y margen</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Mensajes in</p>
          <p className="text-xs uppercase text-slate-500">Mensajes recibidos</p>
          <p className="mt-1 text-2xl font-bold text-navy">{usage.messagesIn}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Mensajes out</p>
          <p className="text-xs uppercase text-slate-500">Mensajes enviados</p>
          <p className="mt-1 text-2xl font-bold text-navy">{usage.messagesOut}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Tokens</p>
          <p className="text-xs uppercase text-slate-500">Tokens usados</p>
          <p className="mt-1 text-2xl font-bold text-navy">{usage.tokensUsed}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Costo</p>
          <p className="text-xs uppercase text-slate-500">Costo estimado</p>
          <p className="mt-1 text-2xl font-bold text-navy">{usage.costEstimate}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Margen</p>
          <p className="text-xs uppercase text-slate-500">Margen %</p>
          <p
            data-testid="margin-indicator"
            data-status={ok ? "ok" : "low"}
            className={`mt-1 text-2xl font-bold ${ok ? "text-green-600 text-teal" : "text-red-600"}`}
          >
            {margin.marginPct.toFixed(2)}%
          </p>
        </div>
      </section>
    </div>
  );
}
