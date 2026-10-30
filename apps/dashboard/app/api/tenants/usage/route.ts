import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { z } from "zod";
import { planDefinition } from "@/lib/panel/plans";

const querySchema = z.object({
  tenantId: z.string().trim().optional().nullable(),
  period: z.string().trim().optional(),
});

function resolveTenantId(session: any, requested: string | null): string | null {
  const sessionTenant = session?.user?.tenantId ?? session?.tenantId ?? null;
  const role = session?.user?.role ?? session?.role;
  if (requested && (requested === sessionTenant || role === "dev_aicore")) {
    return requested;
  }
  return sessionTenant;
}

function startOfMonthUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function parsePeriod(param: string | null): Date {
  if (!param) return startOfMonthUtc(new Date());
  const m = param.match(/^(\d{4})-(\d{2})/);
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  }
  const parsed = new Date(param);
  if (!Number.isNaN(parsed.getTime())) return startOfMonthUtc(parsed);
  return startOfMonthUtc(new Date());
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req?: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const searchParams = req?.nextUrl?.searchParams ?? new URLSearchParams();
  const requestedTenant = searchParams.get("tenantId");
  const tenantId = resolveTenantId(session, requestedTenant);
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
  }

  const periodParam = searchParams.get("period");
  const parsedQuery = querySchema.safeParse({
    tenantId: requestedTenant ?? undefined,
    period: periodParam ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
  }

  const periodStart = parsePeriod(periodParam);
  const periodEnd = new Date(
    Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1)
  );

  try {
    const result = await withTenant(tenantId, async (tx) => {
      let rows: any[] = [];
      if (tx?.tenantUsage?.findMany) {
        rows = await tx.tenantUsage.findMany({
          where: {
            tenantId,
            channel: "whatsapp_text",
            period: { gte: periodStart, lt: periodEnd },
          },
        });
      } else if (tx?.tenantUsage?.findFirst) {
        const one = await tx.tenantUsage.findFirst({
          where: { tenantId, channel: "whatsapp_text", period: periodStart },
        });
        if (one) rows = [one];
      } else if (tx?.tenantUsage?.aggregate) {
        const aggr = await tx.tenantUsage.aggregate({
          where: { tenantId, channel: "whatsapp_text", period: { gte: periodStart, lt: periodEnd } },
          _sum: { messagesIn: true, messagesOut: true, tokensUsed: true, costEstimate: true },
        });
        rows = [
          {
            messagesIn: aggr?._sum?.messagesIn ?? 0,
            messagesOut: aggr?._sum?.messagesOut ?? 0,
            tokensUsed: aggr?._sum?.tokensUsed ?? 0,
            costEstimate: aggr?._sum?.costEstimate ?? 0,
            model: null,
            version: null,
          },
        ];
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

    let tenant = result.tenant;
    if (!tenant && (db as any)?.tenant?.findUnique) {
      try {
        tenant = await (db as any).tenant.findUnique({ where: { id: tenantId } });
      } catch {
        tenant = null;
      }
    }

    const agg = result.rows.reduce(
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

    const revenue = toNumber(planDefinition(tenant?.plan).priceCLP, 19990);
    const cost = agg.cost;
    const marginPct = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

    return NextResponse.json({
      usage: {
        messagesIn: agg.messagesIn,
        messagesOut: agg.messagesOut,
        tokensUsed: agg.tokensUsed,
        costEstimate: cost,
        model: agg.model,
        version: agg.version,
      },
      margin: {
        cost,
        revenue,
        marginPct,
      },
    });
  } catch (error) {
    console.error("[tenants/usage GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar uso" }, { status: 500 });
  }
}