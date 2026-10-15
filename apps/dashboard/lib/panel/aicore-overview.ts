import type { Prisma } from "@prisma/client";
import { planDefinition, type PlanCode } from "./plans";
import {
  IDLE_WARNING_DAYS,
  QUOTA_WARNING_RATIO,
  riskLevelOf,
  type RiskLevel,
} from "./risk";

const DAY_MS = 86_400_000;
const FAILED_PUBLISH_WINDOW_MS = DAY_MS;

/** Business totals shown on top of the Aicore menu. */
export interface PanelTotals {
  activeClients: number;
  mrrCLP: number;
  leadsThisMonth: number;
  conversationsThisMonth: number;
  publishedSites: number;
}

/**
 * Alert kinds with a real data source behind them. "pagos vencidos" is a
 * reserved kind only: there is no payments model yet (billing is M10), so it is
 * deliberately absent from this union instead of being faked with made-up data.
 */
export type AlertKind =
  | "publish_failed"
  | "channel_disabled"
  | "tenant_idle"
  | "usage_over_limit";

export interface PanelAlert {
  id: string;
  kind: AlertKind;
  severity: "alta" | "media" | "baja";
  tenantId: string | null;
  tenantName: string | null;
  detail: string;
  at: string | null;
}

export interface TenantGlanceRow {
  tenantId: string;
  name: string;
  planCode: PlanCode;
  planLabel: string;
  status: string;
  usageThisMonth: number;
  usageLimit: number;
  usageRatio: number;
  siteStatus: string | null;
  channelHealth: "activo" | "sin_canal" | "deshabilitado";
  lastMessageAt: string | null;
  risk: RiskLevel;
}

export interface GlanceChannel {
  channel: string;
  enabled: boolean;
}

export interface GlanceInput {
  tenantId: string;
  name: string;
  plan: string | null;
  status: string;
  usageThisMonth: number;
  channels: GlanceChannel[];
  siteStatus: string | null;
  failedPublishes: number;
  lastMessageAt: Date | null;
  now: Date;
}

export interface AlertTenantInput {
  tenantId: string;
  name: string;
  status: string;
  createdAt: Date;
  plan: string | null;
  channels: GlanceChannel[];
  usageThisMonth: number;
  lastMessageAt: Date | null;
}

const SEVERITY_RANK: Record<PanelAlert["severity"], number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function sortAlerts(alerts: PanelAlert[]): PanelAlert[] {
  return [...alerts].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    if (a.at === b.at) return 0;
    if (a.at === null) return 1;
    if (b.at === null) return -1;
    return a.at < b.at ? 1 : -1;
  });
}

/** Pure mapping from one client's raw state to a glance row. */
export function buildGlanceRow(input: GlanceInput): TenantGlanceRow {
  const plan = planDefinition(input.plan);
  const usageLimit = plan.conversationsPerMonth;
  const usageRatio = usageLimit > 0 ? input.usageThisMonth / usageLimit : 0;
  const hasEnabledChannel = input.channels.some((c) => c.enabled);
  const channelHealth: TenantGlanceRow["channelHealth"] =
    input.channels.length === 0
      ? "sin_canal"
      : hasEnabledChannel
        ? "activo"
        : "deshabilitado";
  const daysSinceLastMessage =
    input.lastMessageAt === null ? null : daysBetween(input.lastMessageAt, input.now);

  return {
    tenantId: input.tenantId,
    name: input.name,
    planCode: plan.code,
    planLabel: plan.label,
    status: input.status,
    usageThisMonth: input.usageThisMonth,
    usageLimit,
    usageRatio,
    siteStatus: input.siteStatus,
    channelHealth,
    lastMessageAt: input.lastMessageAt ? input.lastMessageAt.toISOString() : null,
    risk: riskLevelOf({
      tenantStatus: input.status,
      hasEnabledChannel,
      siteStatus: input.siteStatus,
      failedPublishes: input.failedPublishes,
      usageRatio,
      daysSinceLastMessage,
    }),
  };
}

/**
 * Pure alert builders for everything derivable from a client's own state.
 * Publication failures are not here: they hang off a site, so they are built
 * from the publish log itself.
 */
export function buildConversationAlerts(input: {
  tenants: AlertTenantInput[];
  now: Date;
}): PanelAlert[] {
  const { tenants, now } = input;
  const alerts: PanelAlert[] = [];

  for (const tenant of tenants) {
    const limit = planDefinition(tenant.plan).conversationsPerMonth;
    const ratio = limit > 0 ? tenant.usageThisMonth / limit : 0;
    const base = { tenantId: tenant.tenantId, tenantName: tenant.name };

    if (limit > 0 && ratio >= 1) {
      alerts.push({
        ...base,
        id: `usage_over_limit:${tenant.tenantId}`,
        kind: "usage_over_limit",
        severity: "alta",
        detail: `Uso del mes: ${tenant.usageThisMonth} de ${limit} conversaciones (${Math.round(ratio * 100)}%).`,
        at: now.toISOString(),
      });
    } else if (limit > 0 && ratio >= QUOTA_WARNING_RATIO) {
      alerts.push({
        ...base,
        id: `usage_over_limit:${tenant.tenantId}`,
        kind: "usage_over_limit",
        severity: "media",
        detail: `Uso del mes: ${tenant.usageThisMonth} de ${limit} conversaciones (${Math.round(ratio * 100)}%).`,
        at: now.toISOString(),
      });
    }

    if (
      tenant.status === "activo" &&
      tenant.channels.length > 0 &&
      !tenant.channels.some((c) => c.enabled)
    ) {
      alerts.push({
        ...base,
        id: `channel_disabled:${tenant.tenantId}`,
        kind: "channel_disabled",
        severity: "media",
        detail: "Sin canales habilitados: el negocio no puede recibir consultas.",
        at: null,
      });
    }

    // A client that has been with us for a while and never received a message
    // is just as idle as one whose last message is a fortnight old.
    const idleDays =
      tenant.lastMessageAt === null ? null : daysBetween(tenant.lastMessageAt, now);
    const oldEnough = daysBetween(tenant.createdAt, now) > IDLE_WARNING_DAYS;
    if (
      tenant.status === "activo" &&
      oldEnough &&
      (idleDays === null || idleDays >= IDLE_WARNING_DAYS)
    ) {
      alerts.push({
        ...base,
        id: `tenant_idle:${tenant.tenantId}`,
        kind: "tenant_idle",
        severity: "media",
        detail:
          idleDays === null
            ? `Sin actividad registrada desde su alta hace ${daysBetween(tenant.createdAt, now)} días.`
            : `Sin actividad desde hace ${idleDays} días.`,
        at: tenant.lastMessageAt ? tenant.lastMessageAt.toISOString() : null,
      });
    }
  }

  return sortAlerts(alerts);
}

/**
 * Staff-only reads. The dynamic import keeps this module importable by unit
 * tests: lib/tenant-context pulls lib/db, which throws on import when
 * DATABASE_URL is missing.
 */
async function withAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const { asAdmin } = await import("@/lib/tenant-context");
  return asAdmin(fn);
}

export async function getTotals(now: Date = new Date()): Promise<PanelTotals> {
  const monthStart = startOfMonth(now);

  return withAdmin(async (tx) => {
    const [activeTenants, leadsThisMonth, conversationsThisMonth, publishedSites] =
      await Promise.all([
        tx.tenant.findMany({ where: { status: "activo" }, select: { plan: true } }),
        tx.landingLead.count({ where: { createdAt: { gte: monthStart } } }),
        // Design decision 4: one Conversation row per contact is what "conversations
        // attended" means, because the model has no updatedAt to measure otherwise.
        tx.conversation.count({ where: { createdAt: { gte: monthStart } } }),
        tx.site.count({ where: { status: "published" } }),
      ]);

    return {
      activeClients: activeTenants.length,
      mrrCLP: activeTenants.reduce(
        (sum, tenant) => sum + planDefinition(tenant.plan).priceCLP,
        0,
      ),
      leadsThisMonth,
      conversationsThisMonth,
      publishedSites,
    };
  });
}

export async function getAlerts(now: Date = new Date()): Promise<PanelAlert[]> {
  const monthStart = startOfMonth(now);
  const failedSince = new Date(now.getTime() - FAILED_PUBLISH_WINDOW_MS);

  return withAdmin(async (tx) => {
    const [failedPublishes, tenants, usage, lastMessages] = await Promise.all([
      tx.publishLog.findMany({
        where: { status: "failed", createdAt: { gte: failedSince } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          error: true,
          target: true,
          createdAt: true,
          site: {
            select: { subdomain: true, tenantId: true, tenant: { select: { name: true } } },
          },
        },
      }),
      tx.tenant.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          plan: true,
          createdAt: true,
          channels: { select: { channel: true, enabled: true } },
        },
      }),
      tx.conversation.groupBy({
        by: ["tenantId"],
        where: { createdAt: { gte: monthStart } },
        _count: { _all: true },
      }),
      tx.message.groupBy({ by: ["tenantId"], _max: { createdAt: true } }),
    ]);

    const usageByTenant = new Map(usage.map((row) => [row.tenantId, row._count._all]));
    const lastMessageByTenant = new Map(
      lastMessages.map((row) => [row.tenantId, row._max.createdAt ?? null]),
    );

    const publishAlerts: PanelAlert[] = failedPublishes.map((log) => ({
      id: `publish_failed:${log.id}`,
      kind: "publish_failed",
      severity: "alta",
      tenantId: log.site?.tenantId ?? null,
      tenantName: log.site?.tenant?.name ?? null,
      detail: `Publicación fallida de ${log.site?.subdomain ?? log.target}${
        log.error ? `: ${log.error}` : ""
      }`,
      at: log.createdAt.toISOString(),
    }));

    return sortAlerts([
      ...publishAlerts,
      ...buildConversationAlerts({
        now,
        tenants: tenants.map((tenant) => ({
          tenantId: tenant.id,
          name: tenant.name,
          status: tenant.status,
          createdAt: tenant.createdAt,
          plan: tenant.plan,
          channels: tenant.channels,
          usageThisMonth: usageByTenant.get(tenant.id) ?? 0,
          lastMessageAt: lastMessageByTenant.get(tenant.id) ?? null,
        })),
      }),
    ]);
  });
}

const RISK_RANK: Record<RiskLevel, number> = { alto: 0, medio: 1, bajo: 2 };

export async function getTenantGlance(now: Date = new Date()): Promise<TenantGlanceRow[]> {
  const monthStart = startOfMonth(now);

  return withAdmin(async (tx) => {
    const [tenants, usage, lastMessages] = await Promise.all([
      tx.tenant.findMany({
        select: {
          id: true,
          name: true,
          plan: true,
          status: true,
          channels: { select: { channel: true, enabled: true } },
          sites: {
            orderBy: { updatedAt: "desc" },
            select: {
              status: true,
              publishLogs: { where: { status: "failed" }, select: { id: true } },
            },
          },
        },
      }),
      // Design decision 4 plus the billing gap: the plan quota is in AI
      // conversations and TenantUsage holds no such counter yet, so the month
      // usage is counted from Conversation rows. When billing (M10, RF-BIL-02)
      // records conversations per tenant, this is the single place to switch.
      tx.conversation.groupBy({
        by: ["tenantId"],
        where: { createdAt: { gte: monthStart } },
        _count: { _all: true },
      }),
      tx.message.groupBy({ by: ["tenantId"], _max: { createdAt: true } }),
    ]);

    const usageByTenant = new Map(usage.map((row) => [row.tenantId, row._count._all]));
    const lastMessageByTenant = new Map(
      lastMessages.map((row) => [row.tenantId, row._max.createdAt ?? null]),
    );

    return tenants
      .map((tenant) =>
        buildGlanceRow({
          tenantId: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          status: tenant.status,
          usageThisMonth: usageByTenant.get(tenant.id) ?? 0,
          channels: tenant.channels,
          siteStatus: tenant.sites[0]?.status ?? null,
          failedPublishes: tenant.sites.reduce((sum, site) => sum + site.publishLogs.length, 0),
          lastMessageAt: lastMessageByTenant.get(tenant.id) ?? null,
          now,
        }),
      )
      .sort((a, b) => {
        const byRisk = RISK_RANK[a.risk] - RISK_RANK[b.risk];
        if (byRisk !== 0) return byRisk;
        return b.usageRatio - a.usageRatio;
      });
  });
}
