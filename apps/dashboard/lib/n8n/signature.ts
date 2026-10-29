import crypto from "crypto";

/**
 * Verifies the signature of an n8n webhook callback.
 *
 * The signature is an HMAC-SHA256 (hex) of the raw request body, optionally
 * prefixed with "sha256=". Comparison is length-safe so a mismatched length
 * never throws (unlike a bare `timingSafeEqual`).
 */
export function verifyN8nWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (
    typeof rawBody !== "string" ||
    typeof signature !== "string" ||
    typeof secret !== "string" ||
    secret.length === 0
  ) {
    return false;
  }

  const provided = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Length check before timingSafeEqual to avoid throwing on mismatched lengths.
  if (expected.length !== provided.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(provided)
    );
  } catch {
    return false;
  }
}

export function parseN8nWebhook(rawBody: string): unknown {
  return JSON.parse(rawBody);
}

// Back-compat aliases.
export const verifyN8nSignature = verifyN8nWebhookSignature;
