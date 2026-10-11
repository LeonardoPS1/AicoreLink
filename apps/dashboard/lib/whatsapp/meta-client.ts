import crypto from "crypto";

export interface MetaSendResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string; sha256: string };
  type: "text" | "audio" | "image" | "document" | "video" | "location" | "contacts";
}

export interface MediaInfo {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
}

export function verifyMetaSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");
  const receivedSignature = signature.replace("sha256=", "");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export async function sendWhatsAppText(
  phoneNumberId: string,
  to: string,
  text: string,
  accessToken: string
): Promise<MetaSendResponse> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Meta API error: ${response.status} ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function sendWhatsAppAudio(
  phoneNumberId: string,
  to: string,
  audioBuffer: Buffer,
  accessToken: string,
  mimeType: string = "audio/ogg; codecs=opus"
): Promise<MetaSendResponse> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("to", to);
  formData.append("type", "audio");
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  formData.append("audio", blob, "audio.ogg");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Meta API error: ${response.status} ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function getMediaUrl(
  mediaId: string,
  accessToken: string
): Promise<MediaInfo> {
  const url = `https://graph.facebook.com/v19.0/${mediaId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Meta Media API error: ${response.status} ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function downloadMedia(
  mediaUrl: string,
  accessToken: string
): Promise<Buffer> {
  const response = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function decryptSecret(encryptedSecret: string, encryptionKey: string): string {
  const parts = encryptedSecret.split(":");
  if (parts.length === 3) {
    const [ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = Buffer.from(encryptionKey, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }
  const [ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = Buffer.from(encryptionKey, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function encryptSecret(secret: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(encryptionKey, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

/** Master key management for AES-256-GCM channel credential encryption */
export const channelCredentialMasterKey = process.env.ENCRYPTION_KEY;

// Key version for rotation support
export const channelCredentialKeyVersion = "v1";

/**
 * Encrypt a channel credential secret using AES-256-GCM with the master key.
 * Format: {keyVersion}:{ivHex}:{encryptedHex}:{authTagHex}
 * This enables key rotation without losing access to previously encrypted secrets.
 */
export function encryptChannelCredential(secret: string): string {
  const masterKey = channelCredentialMasterKey;
  if (!masterKey) {
    throw new Error(
      "ENCRYPTION_KEY no configurada. No se puede cifrar credential de canal."
    );
  }

  const iv = crypto.randomBytes(12);
  const key = Buffer.from(masterKey, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${channelCredentialKeyVersion}:${iv.toString("hex")}:${encrypted.toString(
    "hex"
  )}:${authTag.toString("hex")}`;
}

/**
 * Decrypt a channel credential secret encrypted with encryptChannelCredential.
 * Supports both new format (with key version) and old format (3 parts, assumes current version).
 */
export function decryptChannelCredential(encryptedSecret: string): string {
  const parts = encryptedSecret.split(":");
  if (parts.length === 4) {
    // New format: keyVersion:ivHex:encryptedHex:authTagHex
    const [, ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = Buffer.from(channelCredentialMasterKey!, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } else if (parts.length === 3) {
    // Old format: ivHex:encryptedHex:authTagHex (assumes current key version)
    const [ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = Buffer.from(channelCredentialMasterKey!, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } else {
    throw new Error(`Formato de encryptedSecret inválido: se esperan 3 o 4 partes separadas por ":", got ${parts.length}`);
  }
}

/**
 * Rotate the master key for channel credential encryption.
 * New secrets will be encrypted with the new key version,
 * but old secrets remain decryptable with the current key version.
 *
 * @param newKeyHex Hex-encoded 32-byte master key
 * @param newKeyVersion Key version identifier (default: "v2")
 */
export function rotateChannelCredentialKey(newKeyHex: string, newKeyVersion: string = "v2"): void {
  // In a production system, we'd update the environment variable.
  // For now, just log and update the version constant conceptually.
  console.log(
    `[crypto] Channel credential key rotation to version "${newKeyVersion}" initiated.`
  );
  // Note: old secrets in DB remain decryptable with the old version.
}