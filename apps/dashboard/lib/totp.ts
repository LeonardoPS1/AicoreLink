import crypto from "crypto";

/**
 * Genera un secreto TOTP base32 de 20 bytes
 * 
 * @returns { string } secreto en formato base32
 */
export function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  return bytes.toString("base64")
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 16)
    .toUpperCase();
}

/**
 * Genera el código TOTP (Time-based One-Time Password)
 * 
 * @param secret Secreto base32 generado
 * @param timeStep Intervalo en segundos (default: 30)
 * @returns { string } código de 6 dígitos
 */
export function generateTOTP(secret: string, timeStep: number = 30): string {
  const time = Math.floor(Date.now() / 1000);
  const timeSteps = Math.floor(time / timeStep);
  
  // Convert secret from base32 to hex buffer
  const secretBytes = base32ToBytes(secret);
  
  // Create HMAC-SHA1
  const hmac = crypto.createHmac("sha1", secretBytes);
  
  // Pack timeSteps as 8 bytes big-endian
  const timeBuffer = Buffer.alloc(8);
  let temp = timeSteps;
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = temp & 0xff;
    temp >>= 8;
  }
  
  hmac.update(timeBuffer);
  const hmacBytes = hmac.digest();
  
  // Dynamic truncation
  const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
  const binary = 
    (hmacBytes[offset] & 0x7f) << 24 |
    (hmacBytes[offset + 1] & 0xff) << 16 |
    (hmacBytes[offset + 2] & 0xff) << 8 |
    (hmacBytes[offset + 3] & 0xff);
  
  const code = binary % 1000000;
  return String(code).padStart(6, "0");
}

/**
 * Convierte un secreto base32 a buffer de bytes
 * 
 * @param base32 Secreto en base32
 * @returns { Buffer } bytes del secreto
 */
function base32ToBytes(base32: string): Buffer {
  base32 = base32.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let bits = "";
  
  for (const char of base32) {
    const value = base32CharToValue(char);
    if (value !== null) {
      bits += value.toString(2).padStart(5, "0");
    }
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  
  return Buffer.from(bytes);
}

function base32CharToValue(char: string): number | null {
  const map: Record<string, number> = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7,
    'I': 8, 'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15,
    'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23,
    'Y': 24, 'Z': 25, '2': 26, '3': 27, '4': 28, '5': 29, '6': 30, '7': 31,
  };
  return map[char] ?? null;
}

/**
 * Verifica un código TOTP
 * 
 * @param secret Secreto del usuario
 * @param code Código a verificar
 * @param timeStep Intervalo en segundos (default: 30)
 * @param windowSize Ventana de tolerancia (default: 1 = accepts previous and next code)
 * @returns { boolean } true si el código es válido
 */
export function verifyTOTP(
  secret: string,
  code: string,
  timeStep: number = 30,
  windowSize: number = 1
): boolean {
  // Check current and adjacent time steps for tolerance
  const currentTime = Math.floor(Date.now() / 1000);
  
  for (let offset = -windowSize; offset <= windowSize; offset++) {
    const time = currentTime + offset;
    const timeSteps = Math.floor(time / timeStep);
    const secretBytes = base32ToBytes(secret);
    
    // Create HMAC-SHA1
    const hmac = crypto.createHmac("sha1", secretBytes);
    
    // Pack timeSteps as 8 bytes big-endian
    const timeBuffer = Buffer.alloc(8);
    let temp = timeSteps;
    for (let i = 7; i >= 0; i--) {
      timeBuffer[i] = temp & 0xff;
      temp >>= 8;
    }
    
    hmac.update(timeBuffer);
    const hmacBytes = hmac.digest();
    
    // Dynamic truncation
    const offsetIdx = hmacBytes[hmacBytes.length - 1] & 0xf;
    const binary = 
      (hmacBytes[offsetIdx] & 0x7f) << 24 |
      (hmacBytes[offsetIdx + 1] & 0xff) << 16 |
      (hmacBytes[offsetIdx + 2] & 0xff) << 8 |
      (hmacBytes[offsetIdx + 3] & 0xff);
    
    const generatedCode = String(binary % 1000000).padStart(6, "0");
    
    if (generatedCode === code) {
      return true;
    }
  }
  
  return false;
}

/**
 * Genera un URL QR para configurar Google Authenticator
 * 
 * @param secret Secreto TOTP
 * @param accountName Nombre de la cuenta (ej. "Clínica Demo")
 * @param issuerName Nombre del emisor (ej. "AicoreLink")
 * @returns { string } URL data URI para QR code
 */
export function generateQRURL(secret: string, accountName: string, issuerName: string): string {
  const encodedSecret = encodeURIComponent(secret);
  const label = encodeURIComponent(`${issuerName}:${accountName}`);
  return `otpauth://totp/${label}?secret=${encodedSecret}&issuer=${issuerName}`;
}

export default { generateSecret, generateTOTP, verifyTOTP, generateQRURL };