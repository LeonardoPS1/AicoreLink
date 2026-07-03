import { db } from "./db";

interface AuditEntry {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  meta?: Record<string, unknown>;
}

/**
 * Registro simple de auditoria. Usar para cualquier accion sensible:
 * activar/desactivar modulos, cambios de plan, cambios de configuracion
 * de canal, etc. No requiere contexto de tenant especifico (usa el
 * cliente base de Prisma) porque audit_log no lleva RLS -se consulta
 * unicamente desde el panel admin.
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
