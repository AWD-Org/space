import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { isSentinel, type Db, type DocData, type QueryOptions, type Tx, type WithId } from "./types";

/**
 * Driver local para desarrollo y pruebas sin red.
 * Guarda todo en .local-data/db.json. Nunca se usa en Vercel.
 */

const DATA_DIR = path.join(process.cwd(), ".local-data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type Store = Map<string, DocData>;
const g = globalThis as unknown as { __spaceMemDb?: Store; __spaceMemTimer?: NodeJS.Timeout };

function load(): Store {
  if (g.__spaceMemDb) return g.__spaceMemDb;
  let map: Store = new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Record<string, DocData>;
    map = new Map(Object.entries(raw));
  } catch {
    /* sin datos previos */
  }
  g.__spaceMemDb = map;
  return map;
}

function persist() {
  if (g.__spaceMemTimer) clearTimeout(g.__spaceMemTimer);
  g.__spaceMemTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(Object.fromEntries(load()), null, 1));
  }, 50);
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function setDotted(target: DocData, key: string, value: unknown) {
  const parts = key.split(".");
  let obj: DocData = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof obj[k] !== "object" || obj[k] === null) obj[k] = {};
    obj = obj[k] as DocData;
  }
  const last = parts[parts.length - 1];
  if (isSentinel(value)) {
    if (value.__op === "delete") delete obj[last];
    else obj[last] = (typeof obj[last] === "number" ? (obj[last] as number) : 0) + value.by;
  } else {
    obj[last] = clone(value);
  }
}

function getField(doc: DocData, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as DocData)[k] : undefined), doc);
}

function compare(a: unknown, b: unknown) {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return (a as number) < (b as number) ? -1 : 1;
}

function matches(doc: DocData, opts?: QueryOptions) {
  return (opts?.where ?? []).every(([field, op, value]) => {
    const v = getField(doc, field);
    switch (op) {
      case "==": return v === value;
      case "!=": return v !== value;
      case ">=": return compare(v, value) >= 0;
      case "<=": return compare(v, value) <= 0;
      case ">": return compare(v, value) > 0;
      case "<": return compare(v, value) < 0;
      case "in": return Array.isArray(value) && value.includes(v);
    }
  });
}

function writeDoc(p: string, data: DocData, merge: boolean) {
  const db = load();
  const base: DocData = merge ? clone(db.get(p) ?? {}) : {};
  for (const [k, v] of Object.entries(data)) setDotted(base, k, v);
  db.set(p, base);
}

function updateDoc(p: string, data: DocData) {
  const db = load();
  if (!db.has(p)) throw new Error(`No existe el documento ${p}`);
  writeDoc(p, data, true);
}

export const memoryDb: Db = {
  async get<T>(p: string) {
    const d = load().get(p);
    return d ? ({ ...(clone(d) as T), id: p.split("/").pop()! } as WithId<T>) : null;
  },
  async set(p, data, opts) {
    writeDoc(p, data, Boolean(opts?.merge));
    persist();
  },
  async update(p, data) {
    updateDoc(p, data);
    persist();
  },
  async delete(p) {
    load().delete(p);
    persist();
  },
  async list<T>(col: string, opts?: QueryOptions) {
    const depth = col.split("/").length + 1;
    let rows: WithId<T>[] = [];
    for (const [p, d] of load()) {
      if (p.startsWith(col + "/") && p.split("/").length === depth && matches(d, opts)) {
        rows.push({ ...(clone(d) as T), id: p.split("/").pop()! });
      }
    }
    if (opts?.orderBy) {
      const [field, dir = "asc"] = opts.orderBy;
      rows.sort((a, b) => compare(getField(a as DocData, field), getField(b as DocData, field)) * (dir === "desc" ? -1 : 1));
    }
    if (opts?.limit) rows = rows.slice(0, opts.limit);
    return rows;
  },
  async count(col, opts) {
    return (await memoryDb.list(col, opts)).length;
  },
  async batchUpdate(updates) {
    for (const u of updates) updateDoc(u.path, u.data);
    persist();
  },
  async tx(fn) {
    const ops: (() => void)[] = [];
    const tx: Tx = {
      get: (p) => memoryDb.get(p),
      set: (p, data, opts) => void ops.push(() => writeDoc(p, data, Boolean(opts?.merge))),
      update: (p, data) => void ops.push(() => updateDoc(p, data)),
      delete: (p) => void ops.push(() => load().delete(p)),
    };
    const result = await fn(tx);
    ops.forEach((op) => op());
    persist();
    return result;
  },
  newId: () => crypto.randomBytes(10).toString("base64url").replace(/[-_]/g, "x").slice(0, 20),
};
