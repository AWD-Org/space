"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  getRedirectResult,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseClientConfig, hasFirebaseClient, isLocalMode } from "@/lib/env";

let app: FirebaseApp | undefined;
function clientAuth() {
  if (!hasFirebaseClient) throw new Error("Space todavía no está conectado a su sistema de cuentas.");
  // El acceso con Google redirige y vuelve a este mismo dominio (el handler de Firebase se
  // sirve por /__/auth gracias al rewrite de next.config.js), así no depende de popups ni de cookies de terceros.
  app = app ?? getApps()[0] ?? initializeApp({ ...firebaseClientConfig, authDomain: typeof window !== "undefined" ? window.location.host : firebaseClientConfig.authDomain });
  const auth = getAuth(app);
  auth.languageCode = "es";
  return auth;
}

async function postSession(body: unknown) {
  const res = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "No pudimos iniciar tu sesión.");
}

async function startSession(user: User) {
  await postSession({ idToken: await user.getIdToken(true) });
}

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No hay una cuenta con ese correo.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Entra con él.",
  "auth/weak-password": "Usa una contraseña de al menos 8 caracteres.",
  "auth/invalid-email": "Revisa tu correo.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
  "auth/account-exists-with-different-credential": "Ya existe una cuenta con ese correo. Entra con tu correo y contraseña.",
  "auth/user-disabled": "Esta cuenta está desactivada. Escríbenos para ayudarte.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
};

export const GENERIC_ERROR = "No pudimos completar el acceso. Intenta de nuevo en un momento.";

/** Errores que no son un fallo: la persona canceló o se abrió otro intento. */
export function isSilentAuthError(err: unknown) {
  const code = (err as { code?: string })?.code;
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || code === "auth/user-cancelled";
}

export function authErrorMessage(err: unknown) {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  // Nunca mostramos textos crudos de Firebase («Firebase: Error (auth/...)»).
  const message = err instanceof Error ? err.message : "";
  if (code?.startsWith("auth/") || /firebase/i.test(message) || !message) return GENERIC_ERROR;
  return message;
}

export const localModeAuth = isLocalMode && !hasFirebaseClient;

export async function signInWithEmail(email: string, password: string) {
  if (localModeAuth) return postSession({ local: { email } });
  const cred = await signInWithEmailAndPassword(clientAuth(), email, password);
  await startSession(cred.user);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  if (localModeAuth) return postSession({ local: { email, name } });
  const cred = await createUserWithEmailAndPassword(clientAuth(), email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await startSession(cred.user);
}

export async function signInWithGoogle(): Promise<"away" | void> {
  if (localModeAuth) return postSession({ local: { email: "google.local@space.test", name: "Cuenta de prueba" } });
  try {
    sessionStorage.setItem(GOOGLE_PENDING, "1");
  } catch {
    /* sin almacenamiento */
  }
  await signInWithRedirect(clientAuth(), new GoogleAuthProvider());
  return "away";
}

const GOOGLE_PENDING = "space-google-pending";

export function googleRedirectPending() {
  try {
    return sessionStorage.getItem(GOOGLE_PENDING) === "1";
  } catch {
    return false;
  }
}

/** Al volver de Google: crea la sesión si el acceso terminó. Devuelve true si hubo sesión nueva. */
export async function completeGoogleRedirect() {
  if (localModeAuth || !hasFirebaseClient) return false;
  try {
    const result = await getRedirectResult(clientAuth());
    if (!result) return false;
    await startSession(result.user);
    return true;
  } finally {
    try {
      sessionStorage.removeItem(GOOGLE_PENDING);
    } catch {
      /* sin almacenamiento */
    }
  }
}

export async function resetPassword(email: string) {
  if (localModeAuth) return;
  await sendPasswordResetEmail(clientAuth(), email);
}

export async function signOut() {
  await fetch("/api/session", { method: "DELETE" });
  if (hasFirebaseClient) await fbSignOut(clientAuth()).catch(() => {});
}
