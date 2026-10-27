import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  verifyChatwootSignature,
  parseChatwootWebhook,
} from "@/lib/chatwoot/signature";

function sign(rawBody: string, timestamp: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `sha256=${hmac.digest("hex")}`;
}

describe("verifyChatwootSignature", () => {
  const secret = "test-secret";
  const rawBody = JSON.stringify({ event: "message_created", id: 1 });

  it("passes for a valid signature", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(rawBody, timestamp, secret);
    expect(verifyChatwootSignature(rawBody, timestamp, signature, secret)).toBe(
      true
    );
  });

  it("fails when timestamp is outside the 5 minute window", () => {
    const timestamp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000).toString();
    const signature = sign(rawBody, timestamp, secret);
    expect(verifyChatwootSignature(rawBody, timestamp, signature, secret)).toBe(
      false
    );
  });

  it("does not throw for a signature of different length", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    expect(() =>
      verifyChatwootSignature(rawBody, timestamp, "sha256=abc", secret)
    ).not.toThrow();
    expect(verifyChatwootSignature(rawBody, timestamp, "sha256=abc", secret)).toBe(
      false
    );
  });

  it("fails for an invalid signature", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(rawBody, timestamp, secret);
    const tampered = signature.replace(/[0-9a-f]/, (c) =>
      c === "a" ? "b" : "a"
    );
    expect(verifyChatwootSignature(rawBody, timestamp, tampered, secret)).toBe(
      false
    );
  });

  it("accepts a signature without the sha256= prefix", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(rawBody, timestamp, secret).replace("sha256=", "");
    expect(verifyChatwootSignature(rawBody, timestamp, signature, secret)).toBe(
      true
    );
  });
});

describe("parseChatwootWebhook", () => {
  it("parses the raw body into a payload", () => {
    const rawBody = JSON.stringify({ event: "message_created", id: 42 });
    const payload = parseChatwootWebhook(rawBody);
    expect(payload.event).toBe("message_created");
    expect(payload.id).toBe(42);
  });
});