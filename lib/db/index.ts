import "server-only";
import { isLocalMode } from "@/lib/env";
import { hasFirebaseAdmin } from "@/lib/firebase/admin";
import type { Db } from "./types";

export * from "./types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("Space todavía no está conectado a su base de datos.");
  }
}

export function backendReady() {
  return isLocalMode || hasFirebaseAdmin;
}

export async function getDb(): Promise<Db> {
  if (isLocalMode) return (await import("./memory")).memoryDb;
  if (hasFirebaseAdmin) return (await import("./firestore")).firestoreDb;
  throw new BackendNotConfiguredError();
}
