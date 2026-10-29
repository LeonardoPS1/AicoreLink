import crypto from "crypto";
import type { ChatwootWebhookPayload } from "./types";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const SIGNATURE_PREFIX = "sha256=";

function timestampToMillis(timestamp: string): number {
  const value = Number(timestamp);
  if (!Number.isFinite(value)) return NaN;
  // Heuristic: 10 digits (or fewer) -> seconds; otherwise milliseconds.
  if (timestamp.trim().length <= 10) return value * 1000;
  return value;
}

export function verifyChatwootSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  if (
    typeof rawBody !== "string" ||
    typeof timestamp !== "string" ||
    typeof signature !== "string" ||
    typeof secret !== "string" ||
    secret.length === 0
  ) {
    return false;
  }

  const tsMs = timestampToMillis(timestamp);
  if (!Number.isFinite(tsMs)) return false;
  if (Math.abs(Date.now() - tsMs) > FIVE_MINUTES_MS) return false;

  const provided = signature.startsWith(SIGNATURE_PREFIX)
    ? signature.slice(SIGNATURE_PREFIX.length)
    : signature;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (expected.length !== provided.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex")
    );
  } catch {
    return false;
  }
}

export function parseChatwootWebhook(rawBody: string): ChatwootWebhookPayload {
  return JSON.parse(rawBody) as ChatwootWebhookPayload;
}