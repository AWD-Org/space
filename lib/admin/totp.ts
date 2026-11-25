import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** TOTP (RFC 6238): SHA-1, 6 dígitos, paso de 30 s. Compatible con Google Authenticator. */
export const STEP_S = 30;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer | null {
  const clean = s.replace(/[\s=-]/g, "").toUpperCase();
  if (!clean || /[^A-Z2-7]/.test(clean)) return null;
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function newSecret(): string {
  return base32Encode(randomBytes(20));
}

export function hotp(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", key).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

export function stepAt(ms: number): number {
  return Math.floor(ms / 1000 / STEP_S);
}

/**
 * Compara el código con la ventana ±1 paso (tolera reloj desfasado).
 * Devuelve el paso que coincidió, o null. La comparación es de tiempo constante.
 */
export function matchStep(secretB32: string, code: string, now = Date.now()): number | null {
  const key = base32Decode(secretB32);
  if (!key || !/^\d{6}$/.test(code)) return null;
  const cur = stepAt(now);
  let found: number | null = null;
  for (const s of [cur - 1, cur, cur + 1]) {
    const a = Buffer.from(hotp(key, s));
    const b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) found = s;
  }
  return found;
}

export function otpauthUri(secretB32: string, account: string, issuer = "Space Admin"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP_S}`;
}
