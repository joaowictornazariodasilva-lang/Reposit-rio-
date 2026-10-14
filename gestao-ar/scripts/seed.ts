/**
 * Recria o banco de demonstração.
 *   npm run db:seed            → popula se estiver vazio
 *   npm run db:seed -- --reset → apaga tudo e popula de novo (só PGlite local)
 */
import { rm } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import { semearSeVazio } from "../src/server/db/seed";

const migrationsFolder = path.join(process.cwd(), "src/server/db/migrations");
const reset = process.argv.includes("--reset");

async function main() {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder });
    if (reset) {
      console.error("--reset não é suportado com DATABASE_URL (proteção contra apagar produção).");
      process.exit(1);
    }
    console.log((await semearSeVazio(db)) ? "Dados de demonstração criados." : "Banco já tinha dados — nada feito.");
    await pool.end();
    return;
  }
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data/pglite");
  if (reset) await rm(dir, { recursive: true, force: true });
  await (await import("node:fs/promises")).mkdir(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const pg = await PGlite.create(dir);
  const db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder });
  const t0 = Date.now();
  const criou = await semearSeVazio(db as never);
  const r = await db.execute(sql`select (select count(*) from clientes) c, (select count(*) from equipamentos) e, (select count(*) from ordens_servico) o`);
  console.log(criou ? `Dados de demonstração criados em ${Date.now() - t0} ms.` : "Banco já tinha dados — nada feito.", r.rows[0]);
  await pg.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
