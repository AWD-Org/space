export type DocData = Record<string, unknown>;
export type WithId<T> = T & { id: string };

export type WhereOp = "==" | "!=" | ">=" | "<=" | ">" | "<" | "in";
export type Where = [field: string, op: WhereOp, value: unknown];

export interface QueryOptions {
  where?: Where[];
  orderBy?: [field: string, dir?: "asc" | "desc"];
  limit?: number;
}

/** Centinelas que cada driver traduce (incremento atómico y borrado de campo). */
export type IncrementSentinel = { __op: "increment"; by: number };
export type DeleteSentinel = { __op: "delete" };

export interface Tx {
  get<T = DocData>(path: string): Promise<WithId<T> | null>;
  set(path: string, data: DocData, opts?: { merge?: boolean }): void;
  update(path: string, data: DocData): void;
  delete(path: string): void;
}

export interface Db {
  get<T = DocData>(path: string): Promise<WithId<T> | null>;
  set(path: string, data: DocData, opts?: { merge?: boolean }): Promise<void>;
  /** Acepta llaves con punto ("counts.products") para campos anidados. */
  update(path: string, data: DocData): Promise<void>;
  delete(path: string): Promise<void>;
  list<T = DocData>(collectionPath: string, opts?: QueryOptions): Promise<WithId<T>[]>;
  count(collectionPath: string, opts?: QueryOptions): Promise<number>;
  /** Escrituras en lote (máx. 500), usado para reordenar. */
  batchUpdate(updates: { path: string; data: DocData }[]): Promise<void>;
  /** Transacción: todas las lecturas antes de las escrituras. */
  tx<R>(fn: (tx: Tx) => Promise<R>): Promise<R>;
  newId(): string;
}

export const increment = (by: number): IncrementSentinel => ({ __op: "increment", by });
export const deleteField = (): DeleteSentinel => ({ __op: "delete" });

export function isSentinel(v: unknown): v is IncrementSentinel | DeleteSentinel {
  return typeof v === "object" && v !== null && "__op" in v;
}
