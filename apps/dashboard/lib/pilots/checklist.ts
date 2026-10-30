import { asAdmin } from "@/lib/tenant-context";

export type ChecklistItem =
  | "whatsapp_connected"
  | "kb_loaded"
  | "site_published"
  | "billing_active";

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  "whatsapp_connected",
  "kb_loaded",
  "site_published",
  "billing_active",
];

export interface ChecklistState {
  whatsapp_connected: boolean;
  kb_loaded: boolean;
  site_published: boolean;
  billing_active: boolean;
}

export function defaultChecklist(): ChecklistState {
  return {
    whatsapp_connected: false,
    kb_loaded: false,
    site_published: false,
    billing_active: false,
  };
}

export function isChecklistComplete(checklist: Partial<ChecklistState>): boolean {
  return CHECKLIST_ITEMS.every((item) => checklist[item] === true);
}

/**
 * Updates a single checklist item for a tenant's pilot onboarding.
 * Recomputes status: if all items are true → completed.
 */
export async function updateChecklist(
  tenantId: string,
  item: ChecklistItem,
  value: boolean
): Promise<{ status: string; checklist: ChecklistState }> {
  return asAdmin(async (tx) => {
    const onboarding = await tx.pilotOnboarding.findUnique({
      where: { tenantId },
    });
    if (!onboarding) {
      throw new Error("PilotOnboarding not found for tenant");
    }

    const checklist = { ...defaultChecklist(), ...(onboarding.checklist as Partial<ChecklistState>) };
    checklist[item] = value;

    const complete = isChecklistComplete(checklist);
    const status = complete ? "completed" : "in_progress";

    const updated = await tx.pilotOnboarding.update({
      where: { tenantId },
      data: {
        checklist,
        status,
        ...(complete ? { completedAt: new Date() } : {}),
      },
    });

    return { status: updated.status, checklist };
  });
}