/** Lectura de variables de Firebase Admin sin cargar el SDK (para no romper páginas públicas). */
export function privateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? "";
  // Algunos paneles guardan los saltos de línea escapados y otros pegan la clave entre comillas.
  return key.trim().replace(/\\n/g, "\n").replace(/^"|"$/g, "");
}

export const hasFirebaseAdmin = Boolean(
  process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
);

export const privateKeyLooksValid = () => {
  const k = privateKey();
  return k.includes("BEGIN PRIVATE KEY") && k.includes("\n") && k.includes("END PRIVATE KEY");
};
