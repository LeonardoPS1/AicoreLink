// Risk scoring for the per-client glance on the Aicore menu.
//
// Pure function: no I/O and no database access, so the same thresholds can be
// unit tested and reused by any surface. The first matching rule wins, and the
// rules are ordered from highest to lowest severity.

export type RiskLevel = "alto" | "medio" | "bajo";

export interface RiskInput {
  tenantStatus: string;
  hasEnabledChannel: boolean;
  siteStatus: string | null;
  failedPublishes: number;
  usageRatio: number;
  daysSinceLastMessage: number | null;
}

// Exported so the overview queries raise alerts on exactly the same thresholds
// the glance colours a row with: two copies would drift apart silently.
export const QUOTA_WARNING_RATIO = 0.8;
export const IDLE_WARNING_DAYS = 7;

// A failed publication is only alarming while it is fresh. Past this window the
// same event must stop raising an alert AND stop colouring the client as high
// risk, so both queries read the window from this one constant.
export const FAILED_PUBLISH_WINDOW_MS = 24 * 60 * 60 * 1000;

const IDLE_CRITICAL_DAYS = 14;

const UNFINISHED_SITE_STATUSES = ["draft", "review", "generating"];

export function riskLevelOf(input: RiskInput): RiskLevel {
  const {
    tenantStatus,
    hasEnabledChannel,
    siteStatus,
    failedPublishes,
    usageRatio,
    daysSinceLastMessage,
  } = input;

  // alto: something is broken for the client right now.
  if (tenantStatus !== "activo") return "alto";
  if (!hasEnabledChannel) return "alto";
  if (failedPublishes > 0) return "alto";
  if (usageRatio >= 1) return "alto";
  if (daysSinceLastMessage !== null && daysSinceLastMessage >= IDLE_CRITICAL_DAYS) {
    return "alto";
  }

  // medio: attention before it becomes a breakage.
  if (usageRatio >= QUOTA_WARNING_RATIO) return "medio";
  if (daysSinceLastMessage !== null && daysSinceLastMessage >= IDLE_WARNING_DAYS) {
    return "medio";
  }
  if (siteStatus !== null && UNFINISHED_SITE_STATUSES.includes(siteStatus)) {
    return "medio";
  }
  // A client that never received a message was never got running, but nothing
  // is broken either: the account is active, the channel is on and the quota is
  // fine, so it stays at medio whether or not there is a site on file. The alert
  // list agrees -- "sin actividad desde su alta" is reported as media there.
  if (daysSinceLastMessage === null) return "medio";

  return "bajo";
}
