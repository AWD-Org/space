import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { hasFirebaseAdmin, privateKey } from "./config";

export { hasFirebaseAdmin, privateKeyLooksValid } from "./config";

let app: App | undefined;

export function adminApp(): App {
  if (app) return app;
  if (!hasFirebaseAdmin) {
    throw new Error("Firebase no está configurado: faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY.");
  }
  app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey(),
      }),
    });
  return app;
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
