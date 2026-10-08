import "server-only";
import { FieldValue, type DocumentData, type Query, type QueryDocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { isSentinel, type Db, type DocData, type QueryOptions, type Tx, type WithId } from "./types";

function convert(data: DocData): DocumentData {
  const out: DocumentData = {};
  for (const [k, v] of Object.entries(data)) {
    if (isSentinel(v)) out[k] = v.__op === "increment" ? FieldValue.increment(v.by) : FieldValue.delete();
    else out[k] = v;
  }
  return out;
}

/** En set con merge, las llaves con punto deben ir anidadas. */
function nest(data: DocumentData): DocumentData {
  const out: DocumentData = {};
  for (const [k, v] of Object.entries(data)) {
    const parts = k.split(".");
    let obj = out;
    for (let i = 0; i < parts.length - 1; i++) {
      obj[parts[i]] = obj[parts[i]] ?? {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = v;
  }
  return out;
}

function buildQuery(col: string, opts?: QueryOptions): Query {
  let q: Query = adminDb().collection(col);
  for (const [field, op, value] of opts?.where ?? []) q = q.where(field, op, value);
  if (opts?.orderBy) q = q.orderBy(opts.orderBy[0], opts.orderBy[1] ?? "asc");
  if (opts?.limit) q = q.limit(opts.limit);
  return q;
}

export const firestoreDb: Db = {
  async get<T>(path: string) {
    const snap = await adminDb().doc(path).get();
    return snap.exists ? ({ ...(snap.data() as T), id: snap.id } as WithId<T>) : null;
  },
  async set(path, data, opts) {
    await adminDb().doc(path).set(nest(convert(data)), { merge: Boolean(opts?.merge) });
  },
  async update(path, data) {
    await adminDb().doc(path).update(convert(data));
  },
  async delete(path) {
    await adminDb().doc(path).delete();
  },
  async list<T>(col: string, opts?: QueryOptions) {
    const snap = await buildQuery(col, opts).get();
    return snap.docs.map((d: QueryDocumentSnapshot) => ({ ...(d.data() as T), id: d.id }));
  },
  async count(col, opts) {
    const snap = await buildQuery(col, opts).count().get();
    return snap.data().count;
  },
  async batchUpdate(updates) {
    const db = adminDb();
    for (let i = 0; i < updates.length; i += 450) {
      const batch = db.batch();
      for (const u of updates.slice(i, i + 450)) batch.update(db.doc(u.path), convert(u.data));
      await batch.commit();
    }
  },
  async tx(fn) {
    const db = adminDb();
    return db.runTransaction(async (t: Transaction) => {
      const tx: Tx = {
        async get<T>(path: string) {
          const snap = await t.get(db.doc(path));
          return snap.exists ? ({ ...(snap.data() as T), id: snap.id } as WithId<T>) : null;
        },
        set: (path, data, opts) => void t.set(db.doc(path), nest(convert(data)), { merge: Boolean(opts?.merge) }),
        update: (path, data) => void t.update(db.doc(path), convert(data)),
        delete: (path) => void t.delete(db.doc(path)),
      };
      return fn(tx);
    });
  },
  newId: () => adminDb().collection("_").doc().id,
};
