/**
 * Minimal Chatwoot API client.
 *
 * Used by the ingestion route to send the assistant's reply back through the
 * tenant's Chatwoot conversation. Reads the base URL from `CHATWOOT_BASE_URL`
 * (or an explicit `baseUrl`) and authenticates with the `api_access_token`
 * header, matching Chatwoot's REST convention.
 */

export interface SendChatwootMessageInput {
  accountId: number | string;
  conversationId: number | string;
  content: string;
  accessToken: string;
  baseUrl?: string;
  messageType?: "outgoing" | "incoming";
  private?: boolean;
}

export interface GetChatwootInboxInput {
  accountId: number | string;
  inboxId: number | string;
  accessToken: string;
  baseUrl?: string;
}

function resolveBaseUrl(baseUrl?: string): string {
  const base = baseUrl ?? process.env.CHATWOOT_BASE_URL ?? "";
  return base.replace(/\/+$/, "");
}

export async function sendChatwootMessage(input: SendChatwootMessageInput): Promise<unknown> {
  const base = resolveBaseUrl(input.baseUrl);
  const url = `${base}/api/v1/accounts/${input.accountId}/conversations/${input.conversationId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_access_token: input.accessToken,
    },
    body: JSON.stringify({
      content: input.content,
      message_type: input.messageType ?? "outgoing",
      private: input.private ?? false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Chatwoot send failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function getChatwootInbox(input: GetChatwootInboxInput): Promise<unknown> {
  const base = resolveBaseUrl(input.baseUrl);
  const url = `${base}/api/v1/accounts/${input.accountId}/inboxes/${input.inboxId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      api_access_token: input.accessToken,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Chatwoot inbox fetch failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}