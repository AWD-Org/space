/**
 * Cookie de sesión de administración (`__admin`), firmada con HMAC-SHA256.
 * Solo usa Web Crypto para poder correr también en el middleware (Edge).
 * La llave se deriva del secreto TOTP: cambiar el secreto invalida todas las sesiones.
 */
export const ADMIN_COOKIE = "__admin";
export const IDLE_MS = 30 * 60 * 1000; // 30 min sin actividad
export const MAX_MS = 8 * 60 * 60 * 1000; // tope absoluto de 8 h
export const FRESH_MS = 5 * 60 * 1000; // ventana para acciones delicadas

export type AdminToken = {
  /** uid de la sesión base de Firebase a la que está atada. */
  u: string;
  /** Inicio de la sesión de admin. */
  i: number;
  /** Última actividad. */
  l: number;
  /** Última verificación de código (login o reconfirmación). */
  f: number;
};

const enc = new TextEncoder();

function b64u(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64u(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string, usage: "sign" | "verify") {
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const derived = await crypto.subtle.sign("HMAC", base, enc.encode("space-admin-session-v1"));
  return crypto.subtle.importKey("raw", derived, { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signToken(t: AdminToken, secret: string): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify(t)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), enc.encode(body));
  return `${body}.${b64u(new Uint8Array(sig))}`;
}

/** Valida firma y estructura (no la vigencia). Devuelve null ante cualquier anomalía. */
export async function readToken(value: string | undefined, secret: string | undefined): Promise<AdminToken | null> {
  if (!value || !secret) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), fromB64u(parts[1]), enc.encode(parts[0]));
    if (!ok) return null;
    const t = JSON.parse(new TextDecoder().decode(fromB64u(parts[0]))) as AdminToken;
    if (typeof t.u !== "string" || !t.u || ![t.i, t.l, t.f].every((n) => Number.isFinite(n))) return null;
    return t;
  } catch {
    return null;
  }
}

/** ¿Sigue vigente por inactividad y por tope absoluto? */
export function isLive(t: AdminToken, now = Date.now()): boolean {
  return now - t.l < IDLE_MS && now - t.i < MAX_MS && t.i <= now + 60_000;
}
export function isFresh(t: AdminToken, now = Date.now()): boolean {
  return now - t.f < FRESH_MS;
}
