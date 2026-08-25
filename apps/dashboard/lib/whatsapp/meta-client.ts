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