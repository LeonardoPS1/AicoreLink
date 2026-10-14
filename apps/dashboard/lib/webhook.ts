import crypto from "crypto";

/**
 * Verifica la firma HMAC-SHA256 de un webhook
 * 
 * @param payload CUERPO del webhook (string o Buffer)
 * @param signature Header de firma (formato 'timestamp=signature' o solo signature)
 * @param secret Secreto compartido para HMAC
 * @returns { boolean } true si la firma es válida
 * 
 * @example
 * // Con header completo
 * const valid = verifyWebhookSigning(
 *   JSON.stringify(req.body),
 *   req.headers['x-signature'] as string,
 *   process.env.WHATSAPP_WEBHOOK_SECRET!
 * );
 * 
 * // Con firma separada
 * const valid = verifyWebhookSigning(
 *   JSON.stringify(req.body),
 *   req.headers['x-signature'] as string,
 *   process.env.WHATSAPP_WEBHOOK_SECRET!
 * );
 */
export function verifyWebhookSigning(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  // Parsear formato 'timestamp=signature' o solo signature
  const parts = signature.split("=");
  const timestamp = parseInt(parts[0], 10);
  const providedSignature = parts[1] || signature;

  // Verificar que el timestamp no tenga más de 5 minutos (prevent replay)
  const now = Date.now();
  if (isNaN(timestamp) || Math.abs(now - timestamp * 1000) > 5 * 60 * 1000) {
    return false;
  }

  // Calcular HMAC-SHA256
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("hex");

  // Compara de forma segura (previene timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature, "hex"),
    Buffer.from(providedSignature, "hex")
  );
}

/**
 * Genera una firma HMAC-SHA256 para un payload
 * 
 * @param payload CUERPO a firmar
 * @param secret Secreto compartido
 * @returns { string } firma en formato 'timestamp=signature'
 */
export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const signature = hmac.digest("hex");

  return `${timestamp}=${signature}`;
}

/**
 * Middleware express/next.js para validar webhooks entrante
 * 
 * @param handler Handler de la ruta del webhook
 * @param secret Secreto para firma HMAC
 * @returns Middleware function
 */
export function webhookValidator(
  handler: (req: any, res: any) => void,
  secret: string
) {
  return async (req: any, res: any) => {
    try {
      const signature = req.headers["x-signature"] as string;
      if (!signature) {
        return res.status(400).json({ error: "Firma faltante" });
      }

      const payload = req.rawBody || JSON.stringify(req.body);
      const valid = verifyWebhookSigning(payload, signature, secret);

      if (!valid) {
        return res.status(401).json({ error: "Firma inválida" });
      }

      // Parsear el body una vez validada la firma
      req.body = JSON.parse(payload as string);
      
      await handler(req, res);
    } catch (error) {
      console.error("[webhook-validator] Error:", error);
      res.status(500).json({ error: "Error interno" });
    }
  };
}

const webhookApi = { verifyWebhookSigning, generateWebhookSignature, webhookValidator };

export default webhookApi;