import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { mkdirSync } from "node:fs";

// DATABASE_URL=postgresql://... uses a real Postgres server.
// Anything else (e.g. DATABASE_URL=pglite) uses an embedded Postgres
// stored in ./.data/pglite, so no database install is needed.
const databaseUrl = process.env.DATABASE_URL ?? "pglite";
const usePostgres = /^postgres(ql)?:\/\//.test(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __contentColonyPglite?: PGlite;
};

export const pool = usePostgres
  ? (globalForDb.__arenaNextJsPostgresqlPool ??= new Pool({
      connectionString: databaseUrl,
    }))
  : undefined;

const pglite = usePostgres
  ? undefined
  : (globalForDb.__contentColonyPglite ??= (() => {
      mkdirSync("./.data", { recursive: true });
      return new PGlite("./.data/pglite");
    })());

export const db = (
  usePostgres ? drizzlePg(pool!) : drizzlePglite(pglite!)
) as ReturnType<typeof drizzlePg>;

export async function closeDb() {
  if (pool) await pool.end();
  if (pglite) await pglite.close();
}
