import { db } from "./db";
import type { Prisma } from "@prisma/client";

interface AuditEntry {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  meta?: Prisma.InputJsonValue;
}

/**
 * Registro de auditoría para actions sensibles.
 * Usado por: login éxito/fallido, cambios de rol, acceso admin,
 * exportación de datos, cambios de configuración de canal.
 * 
 * Nota: audit_log no lleva RLS, las consultas van directo desde el panel admin.
 */
export async function logAudit(entry: AuditEntry) {
  await db.auditLog.create({
    data: {
      tenantId: entry.tenantId ?? null,
      actorId: entry.actorId ?? null,
      action: entry.action,
      meta: entry.meta ?? {},
    },
  });
}

/** Log de login exitoso */
export function logLoginSuccess(tenantId: string, actorId: string, ip?: string, userAgent?: string) {
  logAudit({
    tenantId,
    actorId,
    action: "login.success",
    meta: { ip, userAgent, method: "credentials" },
  });
}

/** Log de login fallido */
export function logLoginFail(actorId: string, ip?: string, userAgent?: string, reason?: string) {
  logAudit({
    tenantId: null,
    actorId,
    action: "login.failed",
    meta: { ip, userAgent, reason },
  });
}

/** Log de cambio de rol */
export function logRoleChange(actorId: string, oldRole: string, newRole: string, tenantId: string, reason?: string) {
  logAudit({
    tenantId,
    actorId,
    action: "role.change",
    meta: { oldRole, newRole, reason },
  });
}

/** Log de acceso al panel admin */
export function logAdminAccess(actorId: string, tenantId: string, action: string, ip?: string, userAgent?: string) {
  logAudit({
    tenantId,
    actorId,
    action: `admin.${action}`,
    meta: { ip, userAgent },
  });
}

/** Log de exportación de datos */
export function logDataExport(actorId: string, tenantId: string, format: "csv" | "pdf", recordCount: number) {
  logAudit({
    tenantId,
    actorId,
    action: "data.export",
    meta: { format, recordCount },
  });
}

/** Log de cambio de configuración de canal */
export function logChannelConfigChange(actorId: string, tenantId: string, channel: string, action: "activate" | "deactivate", meta?: Record<string, unknown>) {
  logAudit({
    tenantId,
    actorId,
    action: `channel.${action}`,
    meta: { channel, ...meta },
  });
}