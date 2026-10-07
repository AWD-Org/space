"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseClientConfig, hasFirebaseClient, isLocalMode } from "@/lib/env";

let app: FirebaseApp | undefined;
function clientAuth() {
  if (!hasFirebaseClient) throw new Error("Space todavía no está conectado a su sistema de cuentas.");
  app = app ?? getApps()[0] ?? initializeApp(firebaseClientConfig);
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
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
};

export function authErrorMessage(err: unknown) {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.";
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

export async function signInWithGoogle() {
  if (localModeAuth) return postSession({ local: { email: "google.local@space.test", name: "Cuenta de prueba" } });
  const cred = await signInWithPopup(clientAuth(), new GoogleAuthProvider());
  await startSession(cred.user);
}

export async function resetPassword(email: string) {
  if (localModeAuth) return;
  await sendPasswordResetEmail(clientAuth(), email);
}

export async function signOut() {
  await fetch("/api/session", { method: "DELETE" });
  if (hasFirebaseClient) await fbSignOut(clientAuth()).catch(() => {});
}
