import { generateWebhookSignature } from "@/lib/webhook";

export interface LeadNotification {
  id: string;
  name: string;
  business: string;
  whatsapp: string;
  vertical: string;
  message: string | null;
  userAgent: string | null;
  createdAt: Date;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  consent: true;
}

const TIMEOUT_MS = 5_000;

/**
 * Hands a new landing lead to n8n so the team gets notified (WhatsApp/Telegram/email).
 *
 * Never throws: the lead is already persisted, and a notification problem must not
 * turn a successful submission into an error for the visitor.
 */
export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  const url = process.env.N8N_LEADS_WEBHOOK_URL;

  if (!url) {
    return;
  }

  const payload = JSON.stringify({
    event: "landing.lead.created",
    lead: { ...lead, createdAt: lead.createdAt.toISOString() },
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.N8N_LEADS_WEBHOOK_SECRET;

  if (secret) {
    headers["x-signature"] = generateWebhookSignature(payload, secret);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: payload,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("[leads] n8n notification rejected", { status: response.status });
    }
  } catch (error) {
    console.error("[leads] n8n notification failed", error);
  }
}
