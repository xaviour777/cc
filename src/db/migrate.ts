import { config } from "dotenv";
config();
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { db, pool, closeDb } from "./index";

async function main() {
  const migrationsFolder = "./drizzle";
  if (pool) await migratePg(db, { migrationsFolder });
  else await migratePglite(db as any, { migrationsFolder });
  console.log("Database tables ready.");
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
