/**
 * Detección de entorno.
 *
 * - Firebase real: cuando están las variables de Firebase.
 * - Modo local: solo fuera de Vercel, para desarrollo y pruebas sin red.
 *   Guarda datos en .local-data/ y usa una sesión simulada.
 */

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const hasFirebaseClient = Boolean(
  firebaseClientConfig.apiKey && firebaseClientConfig.projectId && firebaseClientConfig.appId
);

const onHosting = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL || process.env.NETLIFY);

/** Modo local: forzado con NEXT_PUBLIC_SPACE_LOCAL_MODE=1, o automático en desarrollo sin Firebase. */
export const isLocalMode =
  !onHosting &&
  (process.env.NEXT_PUBLIC_SPACE_LOCAL_MODE === "1" ||
    (!hasFirebaseClient && process.env.NODE_ENV !== "production"));

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://space.amoxtli.tech").replace(/\/$/, "");

/** El registro y el panel solo funcionan con Firebase configurado o en modo local. */
export const authAvailable = hasFirebaseClient || isLocalMode;

/** Bandera de cobro: oculto mientras Space sea gratis. */
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
