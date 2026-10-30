"use client";

import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import { firebaseClientConfig, hasFirebaseClient, isLocalMode } from "@/lib/env";

let app: FirebaseApp | undefined;
let emulatorConnected = false;
/** El SDK de Firebase pesa bastante: se descarga solo cuando de verdad se necesita (al enviar el formulario, no al abrir la página). */
async function loadFirebase() {
  const [appMod, authMod] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  return { appMod, authMod };
}
async function clientAuth() {
  if (!hasFirebaseClient) throw new Error("Space todavía no está conectado a su sistema de cuentas.");
  const { appMod, authMod } = await loadFirebase();
  // El acceso con Google redirige y vuelve a este mismo dominio (el handler de Firebase se
  // sirve por /__/auth gracias al rewrite de next.config.js), así no depende de popups ni de cookies de terceros.
  app = app ?? appMod.getApps()[0] ?? appMod.initializeApp({ ...firebaseClientConfig, authDomain: typeof window !== "undefined" ? window.location.host : firebaseClientConfig.authDomain });
  const auth: Auth = authMod.getAuth(app);
  auth.languageCode = "es";
  // Solo para pruebas: apunta al emulador de Firebase Auth (nunca se define en producción).
  const emu = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (emu && !emulatorConnected) {
    authMod.connectAuthEmulator(auth, emu, { disableWarnings: true });
    emulatorConnected = true;
  }
  return { auth, A: authMod };
}

async function postSession(body: unknown) {
  // Con tope de tiempo: si el servidor no contesta, se avisa en lugar de quedarse en «Entrando…» para siempre.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) throw new Error(json.error || "No pudimos iniciar tu sesión.");
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw new Error("Tardó demasiado en responder. Revisa tu internet e intenta de nuevo.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
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
  const { auth, A } = await clientAuth();
  const cred = await A.signInWithEmailAndPassword(auth, email, password);
  await startSession(cred.user);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  if (localModeAuth) return postSession({ local: { email, name } });
  const { auth, A } = await clientAuth();
  const cred = await A.createUserWithEmailAndPassword(auth, email, password);
  if (name) await A.updateProfile(cred.user, { displayName: name });
  await startSession(cred.user);
  // Confirmación de correo (solo registro con contraseña; Google ya viene verificado). Sin bloquear el registro.
  void fetch("/api/verify-email", { method: "POST" }).catch(() => {});
}

export async function signInWithGoogle(): Promise<"away" | void> {
  if (localModeAuth) return postSession({ local: { email: "google.local@space.test", name: "Cuenta de prueba" } });
  try {
    sessionStorage.setItem(GOOGLE_PENDING, String(Date.now()));
  } catch {
    /* sin almacenamiento */
  }
  const { auth, A } = await clientAuth();
  await A.signInWithRedirect(auth, new A.GoogleAuthProvider());
  return "away";
}

const GOOGLE_PENDING = "space-google-pending";

/** El intento de Google caduca a los 2 minutos: una bandera vieja no debe tapar el formulario. */
export function googleRedirectPending() {
  try {
    const at = Number(sessionStorage.getItem(GOOGLE_PENDING));
    return at > 0 && Date.now() - at < 120_000;
  } catch {
    return false;
  }
}

export function clearGooglePending() {
  try {
    sessionStorage.removeItem(GOOGLE_PENDING);
  } catch {
    /* sin almacenamiento */
  }
}

/** Al volver de Google: crea la sesión si el acceso terminó. Devuelve true si hubo sesión nueva. */
export async function completeGoogleRedirect() {
  if (localModeAuth || !hasFirebaseClient) return false;
  try {
    // Si Firebase no responde en 10 s se suelta la pantalla de carga para que se pueda seguir usando el formulario.
    const result = await Promise.race([clientAuth().then(({ auth, A }) => A.getRedirectResult(auth)), new Promise<null>((r) => setTimeout(() => r(null), 10_000))]);
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
  const { auth, A } = await clientAuth();
  await A.sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  await fetch("/api/session", { method: "DELETE" });
  if (hasFirebaseClient) {
    const { auth, A } = await clientAuth().catch(() => ({ auth: null, A: null }));
    if (auth && A) await A.signOut(auth).catch(() => {});
  }
}

/** ¿La cuenta entra con contraseña? (las de Google no tienen una que cambiar). */
export async function hasPasswordLogin() {
  if (localModeAuth || !hasFirebaseClient) return false;
  const { auth } = await clientAuth();
  await auth.authStateReady();
  return Boolean(auth.currentUser?.providerData.some((p) => p.providerId === "password"));
}

export async function changeDisplayName(name: string) {
  if (localModeAuth) return;
  const { auth, A } = await clientAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error("Vuelve a entrar para cambiar tu nombre."), { code: "space/no-user" });
  await A.updateProfile(user, { displayName: name });
}

export async function changePassword(current: string, next: string) {
  const { auth, A } = await clientAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user?.email) throw Object.assign(new Error("Vuelve a entrar para cambiar tu contraseña."), { code: "space/no-user" });
  await user.reload();
  if (!user.emailVerified) throw Object.assign(new Error("Confirma tu correo antes de cambiar tu contraseña."), { code: "space/email-not-verified" });
  await A.reauthenticateWithCredential(user, A.EmailAuthProvider.credential(user.email, current));
  await A.updatePassword(user, next);
}
